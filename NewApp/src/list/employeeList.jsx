function EmployeeList({ employees, getTextValue }) {
  return (
    <ul>
      {employees.map((p) => (
        <li key={p.id}>
          {getTextValue(p.username)}
        </li>
      ))}
    </ul>
  );
}

export default EmployeeList;