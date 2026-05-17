<?php
/**
 * Module stockupdate — endpoint pour modifier le stock d'un produit
 * Appel : GET /prestashop/modules/stockupdate/stockupdate.php?id_product=X&delta=Y&id_order=Z
 *
 * Paramètres:
 *   - id_product (requis): ID du produit
 *   - id_product_attribute (optionnel): ID de la variante (par défaut 0)
 *   - delta (requis): Quantité à ajouter/retirer (non-zéro)
 *   - id_order (optionnel): ID de la commande pour lier le mouvement (par défaut 0)
 *
 * Utilise StockAvailable::updateQuantity($idProduct, 0, $delta)
 * Enregistre le mouvement dans la table native ps_stock_mvt avec lien à la commande
 */

$rootDir = dirname(dirname(__DIR__));
require_once $rootDir . '/config/config.inc.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$idProduct = (int) Tools::getValue('id_product', 0);
$idProductAttribute = (int) Tools::getValue('id_product_attribute', 0);
$delta     = (int) Tools::getValue('delta', Tools::getValue('quantity', 0));
$idOrder   = (int) Tools::getValue('id_order', 0);
$logOnly   = (int) Tools::getValue('log_only', 0); // Si 1, enregistre juste le mvt sans modifier le stock réel

if ($idProduct <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'id_product manquant ou invalide']);
    exit;
}

if ($delta === 0) {
    http_response_code(400);
    echo json_encode(['error' => 'delta doit être différent de 0']);
    exit;
}

try {
    // Si log_only = 0, on met à jour le stock physique
    if (!$logOnly) {
        StockAvailable::updateQuantity($idProduct, $idProductAttribute, $delta);
    }

    // Récupérer le stock après mise à jour
    $newQty = StockAvailable::getQuantityAvailableByProduct($idProduct, $idProductAttribute);

    // Récupérer l'id_stock_available pour stocker le mouvement dans ps_stock_mvt
    $db = Db::getInstance();
    $context = Context::getContext();
    $shopId = isset($context->shop) ? (int) $context->shop->id : 1;

    $idStockAvailable = (int) $db->getValue(
        'SELECT id_stock_available FROM `' . _DB_PREFIX_ . 'stock_available` 
         WHERE id_product = ' . $idProduct . ' AND id_product_attribute = ' . $idProductAttribute . ' AND id_shop = ' . $shopId
    );

    // Informations sur l'employé (si appel depuis BO)
    $idEmployee = 1;
    $employeeLastname = 'Admin';
    $employeeFirstname = 'Backoffice';
    if (isset($context->employee) && is_object($context->employee)) {
        $idEmployee = (int) $context->employee->id;
        $employeeLastname = $context->employee->lastname ?? $employeeLastname;
        $employeeFirstname = $context->employee->firstname ?? $employeeFirstname;
    }

    // Enregistrer le mouvement dans ps_stock_mvt (table native PrestaShop)
    $sign = $delta > 0 ? 1 : -1;
    $db->insert('stock_mvt', [
        'id_stock'            => $idStockAvailable,
        'id_order'            => $idOrder,  // Maintenant lié à la commande
        'id_supply_order'     => 0,
        'id_stock_mvt_reason' => $delta > 0 ? 1 : 2,  // 1 = augmentation, 2 = diminution
        'id_employee'         => $idEmployee,
        'employee_lastname'   => pSQL($employeeLastname),
        'employee_firstname'  => pSQL($employeeFirstname),
        'physical_quantity'   => abs($delta),
        'date_add'            => date('Y-m-d H:i:s'),
        'sign'                => $sign,
        'price_te'            => '0.000000',
        'last_wa'             => '0.000000',
        'current_wa'          => '0.000000',
        'referer'             => 0,
    ]);

    echo json_encode([
        'success'    => true,
        'id_product' => $idProduct,
        'delta'      => $delta,
        'new_qty'    => (int) $newQty,
        'id_order'   => $idOrder,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
