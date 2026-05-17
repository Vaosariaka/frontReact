<?php
/**
 * Module stockupdate — endpoint pour récupérer l'historique des mouvements de stock
 * Appel : GET /prestashop/modules/stockupdate/stockhistory.php?id_product=X&id_product_attribute=Y
 * 
 * Paramètres:
 *   - id_product (requis): ID du produit
 *   - id_product_attribute (optionnel, défaut 0): ID de la variante/karazany. 0 pour le produit principal
 *
 * Lit la table native ps_stock_mvt via le lien ps_stock_available → id_stock
 */

$rootDir = dirname(dirname(__DIR__));
require_once $rootDir . '/config/config.inc.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$idProduct = (int) Tools::getValue('id_product', 0);
$idProductAttribute = (int) Tools::getValue('id_product_attribute', 0);

if ($idProduct <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'id_product manquant ou invalide']);
    exit;
}

try {
    $db = Db::getInstance();
    $isAggregateView = $idProductAttribute <= 0;

    // Récupérer le nom de la combinaison/karazany si c'est une variante
    $karazanyName = null;
    if ($idProductAttribute > 0) {
        $karazanyName = $db->getValue(
                'SELECT IFNULL(GROUP_CONCAT(DISTINCT al.name ORDER BY a.position SEPARATOR ", "), "") 
             FROM `' . _DB_PREFIX_ . 'product_attribute` pa
             LEFT JOIN `' . _DB_PREFIX_ . 'product_attribute_combination` pac 
                ON pa.id_product_attribute = pac.id_product_attribute
                 LEFT JOIN `' . _DB_PREFIX_ . 'attribute` a 
                     ON pac.id_attribute = a.id_attribute
                 LEFT JOIN `' . _DB_PREFIX_ . 'attribute_lang` al 
                     ON a.id_attribute = al.id_attribute AND al.id_lang = 1
             WHERE pa.id_product = ' . $idProduct . ' AND pa.id_product_attribute = ' . $idProductAttribute
        );
    } else {
        $karazanyName = 'Toutes les déclinaisons';
    }

    // Récupérer les lignes stock_available pour ce produit / déclinaison
    $context = Context::getContext();
    $shopId = isset($context->shop) ? (int) $context->shop->id : 1;
    if ($isAggregateView) {
        $stockRows = $db->executeS(
            'SELECT id_stock_available, id_product_attribute, quantity FROM `' . _DB_PREFIX_ . 'stock_available` 
             WHERE id_product = ' . $idProduct . ' AND id_shop = ' . $shopId . '
             ORDER BY id_product_attribute ASC'
        );
    } else {
        $stockRows = $db->executeS(
            'SELECT id_stock_available, id_product_attribute, quantity FROM `' . _DB_PREFIX_ . 'stock_available` 
             WHERE id_product = ' . $idProduct . ' AND id_product_attribute = ' . $idProductAttribute . ' AND id_shop = ' . $shopId . '
             LIMIT 1'
        );
    }

    $stockIds = [];
    $currentQty = 0;
    foreach ($stockRows as $stockRow) {
        $stockIds[] = (int) ($stockRow['id_stock_available'] ?? 0);
        $currentQty += (int) ($stockRow['quantity'] ?? 0);
    }

    // Fallback si aucun stock_available n'existe
    if (!$stockIds) {
        $currentQty = (int) StockAvailable::getQuantityAvailableByProduct($idProduct, $idProductAttribute);
        echo json_encode(['success' => true, 'id_product' => $idProduct, 'id_product_attribute' => $idProductAttribute, 'current_qty' => $currentQty, 'movements' => []]);
        exit;
    }

    // Lire les mouvements de stock depuis ps_stock_mvt
    // Lire les mouvements de stock depuis ps_stock_mvt
    $movements = $db->executeS(
        'SELECT 
            sm.physical_quantity,
            sm.sign,
            sm.date_add,
            sm.employee_lastname,
            sm.employee_firstname,
            sm.id_order,
            sm.id_supply_order,
            sm.id_stock_mvt_reason,
            smrl.name AS reason,
            sa.id_product_attribute,
            sa.quantity AS stock_quantity
         FROM `' . _DB_PREFIX_ . 'stock_mvt` sm
         LEFT JOIN `' . _DB_PREFIX_ . 'stock_mvt_reason_lang` smrl 
            ON sm.id_stock_mvt_reason = smrl.id_stock_mvt_reason AND smrl.id_lang = 1
         LEFT JOIN `' . _DB_PREFIX_ . 'stock_available` sa
            ON sa.id_stock_available = sm.id_stock
         WHERE sm.id_stock IN (' . implode(',', array_map('intval', $stockIds)) . ')
         ORDER BY sm.date_add DESC
         LIMIT 100'
    );

    // Calculer les totaux vendus / deltas manuels pour dériver un "initial_qty"
    $soldQuantity = 0;
    $manualDeltaQuantity = 0;

    // Pour que "stock_after" ait du sens (ex: un import de +13 affiche bien stock_after=13),
    // nous calculons la quantité chronologiquement depuis le début.
    $chronologicalMovements = array_reverse($movements);
    $runningQtyForHistory = 0;
    $enrichedChronological = [];

    foreach ($chronologicalMovements as $mv) {
        $delta = (int) ($mv['physical_quantity'] ?? 0) * ((int) ($mv['sign'] ?? 0));
        $idOrderMv = (int) ($mv['id_order'] ?? 0);
        $idSupplyOrderMv = (int) ($mv['id_supply_order'] ?? 0);

        if ($idOrderMv > 0) {
            $soldQuantity += max(0, -$delta);
        } else {
            if ($idSupplyOrderMv === 0) {
                $manualDeltaQuantity += $delta;
            }
        }
        
        $movementAttributeId = (int) ($mv['id_product_attribute'] ?? 0);
        $runningQtyForHistory += $delta;

        $enrichedChronological[] = [
            'delta'             => $delta,
            'stock_after'       => $runningQtyForHistory,
            'reason'            => ($mv['reason'] ?? null) ?: 'Mouvement de stock',
            'employee'          => trim(($mv['employee_firstname'] ?? '') . ' ' . ($mv['employee_lastname'] ?? '')),
            'date_add'          => $mv['date_add'] ?? null,
            'id_order'          => (int) ($mv['id_order'] ?? 0),
            'id_supply_order'   => (int) ($mv['id_supply_order'] ?? 0),
            'id_stock_mvt_reason' => (int) ($mv['id_stock_mvt_reason'] ?? 0),
            'id_product_attribute' => $movementAttributeId,
        ];
    }

    // On remet la liste dans l'ordre anti-chronologique pour l'affichage
    $enriched = array_reverse($enrichedChronological);

    // Le stock de départ correspond à la quantité importée ou ajoutée en base (les deltas manuels).
    // Cela correspond au stock initial configuré dans les CSV (ex: 11 pour la montre).
    $initialQty = $manualDeltaQuantity;

    echo json_encode([
        'success'              => true,
        'id_product'           => $idProduct,
        'id_product_attribute' => $idProductAttribute,
        'karazany_name'        => $karazanyName,
        'aggregate_view'       => $isAggregateView,
        'current_qty'          => $currentQty,
        'initial_qty'          => $initialQty,
        'movements'            => $enriched,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
