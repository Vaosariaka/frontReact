import { useEffect, useState } from "react";
import { fetchCategories } from "../api/categoriesApi";

const getCategoryName = (nameField) => {
  if (!nameField) return "-";
  if (typeof nameField === "string") return nameField;
  if (Array.isArray(nameField?.language)) {
    return nameField.language[0]?.["#text"] || "-";
  }
  if (nameField?.language?.["#text"]) {
    return nameField.language["#text"];
  }
  if (nameField?.["#text"]) {
    return nameField["#text"];
  }
  return "-";
};

const getTextValue = (field) => {
  if (field === null || field === undefined) return "-";
  if (typeof field === "string" || typeof field === "number") return String(field);
  if (typeof field === "object") {
    if (field["#text"] !== undefined && field["#text"] !== null) {
      return String(field["#text"]);
    }
  }
  return "-";
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCategories();
        setCategories(Array.isArray(data) ? data : [data]);
      } catch {
        setCategories([]);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h2>Categories ({categories.length})</h2>
      <div className="table-wrap">
        <table className="client-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Parent</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{getTextValue(c.id)}</td>
                <td>{getCategoryName(c.name)}</td>
                <td>{getTextValue(c.id_parent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
