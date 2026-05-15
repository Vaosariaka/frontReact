# Fix CSV Order Import Date Format Validation

The PrestaShop API is returning a validation error (code 85: `Validation error: "La propriété Order->date_add n'est pas valide"`) during the import of [fichier3.csv](file:///opt/lampp/htdocs/frontReact/import/import-data-mai-26%20-%20fichier3.csv) because the dates in the CSV are formatted as `DD/MM/YYYY` (for example: `09/05/2026`). PrestaShop expects dates in the format `YYYY-MM-DD HH:MM:SS`. 

Because the import completely fails, no orders are saved for Rakoto or any other clients, which is why FrontOffice displays "Aucune commande pour le moment".

## Proposed Changes

### PrestaShop API Orders Import
#### [MODIFY] [importApiOrders.js](file:///opt/lampp/htdocs/frontReact/NewApp/src/pagesEmployee/import/importApiOrders.js)
- Update [createOrderFromCsvRow](file:///opt/lampp/htdocs/frontReact/NewApp/src/pagesEmployee/import/importApiOrders.js#329-454) to format the [date](file:///opt/lampp/htdocs/frontReact/NewApp/src/api/ordersApi.js#27-44) string from `DD/MM/YYYY` to `YYYY-MM-DD 00:00:00` before passing it to `dateAdd` when calling [createOrder()](file:///opt/lampp/htdocs/frontReact/NewApp/src/pagesEmployee/import/importApiOrders.js#253-328).

## Verification Plan
### Manual Verification
- Go to the Backoffice, import the CSV file again, and verify that the orders are successfully imported without any errors in the UI or Console.
- Go to the FrontOffice logged in as "Rakoto Rakoto" (or other clients) and verify that "Mes commandes" displays the newly imported orders seamlessly.
