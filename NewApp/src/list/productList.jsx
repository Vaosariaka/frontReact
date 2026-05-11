function ProductList({ products, getTextValue }) {
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>
          {getTextValue(p.price)}
        </li>
      ))}
    </ul>
  );
}

export default ProductList;