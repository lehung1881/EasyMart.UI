type TableRow = Record<string, unknown>;
export type BaseTableEditorExpose = {
    addRow: () => void;
    removeRow: (row: TableRow) => void;
    updateRow: (row: TableRow) => void;
    removeAllRow: () => void;
    clearSelection: () => void;
};
