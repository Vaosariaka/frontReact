import ImportProduct from "./affichageImport/importProduct";
import ImportCombinations from "./affichageImport/importCombinations";
import ImportOrders from "./affichageImport/importOrders";
import ImportImages from "./affichageImport/importImages";
import { createProduct } from "./import/importApiProduct";
import { createCombinationFromCsvRow } from "./import/importApiCombinations";
import { createOrderFromCsvRow } from "./import/importApiOrders";
import { importImageFromZipEntry } from "./import/importApiImages";

export default function BackofficeImportPage() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Import BackOffice</h1>
      <p>
        Fichiers attendus:
        {" "}
        import-data-mai-26 - fichier1.csv,
        {" "}
        import-data-mai-26 - fichier2.csv,
        {" "}
        import-data-mai-26 - fichier3.csv,
        {" "}
        images.zip
      </p>

      <section style={{ marginBottom: "30px" }}>
        <h2>CSV 1 - Produits/Categories</h2>
        <ImportProduct onCreate={createProduct} />
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2>CSV 2 - Declinaisons/Stock</h2>
        <ImportCombinations onCreate={createCombinationFromCsvRow} />
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2>CSV 3 - Clients/Commandes</h2>
        <ImportOrders onCreate={createOrderFromCsvRow} />
      </section>

      <section>
        <h2>ZIP - Images</h2>
        <ImportImages onCreate={importImageFromZipEntry} />
      </section>
    </div>
  );
}
