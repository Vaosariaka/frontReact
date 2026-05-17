<?php
/**
 * Module stockupdate — purge des tables de stock avant un nouvel import.
 * Appel attendu depuis le backoffice PrestaShop.
 */

$rootDir = dirname(dirname(__DIR__));
require_once $rootDir . '/config/config.inc.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    $db = Db::getInstance();
    
    $context = Context::getContext();
    $isEmployee = isset($context->employee) && is_object($context->employee) && (int) $context->employee->id;
    
    // Vérifier authentification : employee OU API key
    if (!$isEmployee) {
        // Si pas d'employee, chercher API key
        // Apache parse Basic auth en PHP_AUTH_USER et PHP_AUTH_PW
        // OU on peut utiliser getallheaders() si disponible
        $apiKey = null;
        
        if (!empty($_SERVER['PHP_AUTH_USER'])) {
            // Apache a parsé Basic auth en variables séparées
            $apiKey = $_SERVER['PHP_AUTH_USER'];
        } elseif (function_exists('getallheaders')) {
            // Fallback si Apache n'a pas parsé
            $allHeaders = getallheaders();
            $authHeader = isset($allHeaders['Authorization']) ? $allHeaders['Authorization'] : '';
            if (!empty($authHeader) && strpos($authHeader, 'Basic ') === 0) {
                $credentials = base64_decode(substr($authHeader, 6));
                $apiKey = explode(':', $credentials)[0];
            }
        }
        
        $apiKeyFound = false;
        if (!empty($apiKey)) {
            try {
                $stmt = $db->executeS('SELECT id_webservice_account FROM `' . _DB_PREFIX_ . 'webservice_account` WHERE `key` = "' . pSQL($apiKey) . '" AND active = 1');
                $apiKeyFound = !empty($stmt);
            } catch (Exception $dbErr) {
                // Si la requête DB échoue, on refuse l'accès
                $apiKeyFound = false;
            }
        }
        
        if (!$apiKeyFound) {
            http_response_code(403);
            echo json_encode(['error' => 'Accès refusé']);
            exit;
        }
    }

    // Purge explicite des mouvements puis des stocks disponibles.
    // On garde les produits/combinaisons pour que le nouvel import puisse les recréer proprement.
    $db->execute('TRUNCATE TABLE `' . _DB_PREFIX_ . 'stock_mvt`');
    $db->execute('DELETE FROM `' . _DB_PREFIX_ . 'stock_available`');

    echo json_encode([
        'success' => true,
        'message' => 'Tables de stock purgées',
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}