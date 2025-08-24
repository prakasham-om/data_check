import { Column, Table, AutoSizer } from "react-virtualized";

export default function CompanyTable({ rows, page, limit, isAdmin, onToggle, onDelete }) {
  return (
    <div style={{ height: 500 }}>
      <AutoSizer>
        {({ width, height }) => (
          <Table
            width={width}
            height={height}
            headerHeight={40}
            rowHeight={45}
            rowCount={rows.length}
            rowGetter={({ index }) => rows[index]}
          >
            <Column label="#" dataKey="index" width={50} cellRenderer={({ rowIndex }) => (page-1)*limit + rowIndex + 1} />
            <Column label="Company" dataKey="companyName" width={200} cellRenderer={({ cellData }) => <a href={`https://${cellData}`} target="_blank" rel="noopener noreferrer">{cellData}</a>} />
            <Column label="Project" dataKey="projectName" width={150} />
            <Column label="Emp ID" dataKey="empId" width={100} />
            <Column label="Date" dataKey="createdAt" width={120} cellRenderer={({ cellData }) => cellData ? new Date(cellData).toLocaleDateString() : "—"} />
            <Column label="Status" dataKey="status" width={150} cellRenderer={({ rowData }) => (
              <>
                <button onClick={() => onToggle(rowData.companyName)} disabled={rowData.status!=='Active'}>Add</button>
                {isAdmin && <button onClick={() => onDelete(rowData.companyName)}>Delete</button>}
              </>
            )} />
          </Table>
        )}
      </AutoSizer>
    </div>
  );
}
