export type DataTableRow = Record<string, string>;

export function getRequiredRow(rows: DataTableRow[], index = 0): DataTableRow {
  const row = rows[index];

  if (!row) {
    throw new Error(`Expected row at index ${index}`);
  }

  return row;
}

export function getRequiredCell(row: DataTableRow, key: string): string {
  const value = row[key];

  if (value === undefined) {
    throw new Error(`Expected column \"${key}\" in DataTable row`);
  }

  return value;
}
