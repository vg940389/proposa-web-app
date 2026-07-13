interface PricingItem {
  description: string
  qty: number
  unit_price: number
}

interface PricingTableBlockProps {
  data: {
    items?: PricingItem[]
  }
  onChange: (data: any) => void
  readOnly?: boolean
}

export function PricingTableBlock({ data, onChange, readOnly = false }: PricingTableBlockProps) {
  const items = data.items || [{ description: '', qty: 1, unit_price: 0 }]

  const handleUpdateItem = (index: number, field: keyof PricingItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onChange({ ...data, items: newItems })
  }

  const handleAddItem = () => {
    onChange({ ...data, items: [...items, { description: '', qty: 1, unit_price: 0 }] })
  }

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onChange({ ...data, items: newItems })
  }

  const total = items.reduce((acc, item) => acc + (item.qty * item.unit_price), 0)

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-600 text-sm font-semibold border-b border-slate-200">
            <th className="p-4">Item</th>
            <th className="p-4 text-center w-24">Qty</th>
            <th className="p-4 text-right w-32">Price</th>
            <th className="p-4 text-right w-32">Total</th>
            {!readOnly && <th className="p-4 w-12"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="p-4">
                {readOnly ? (
                  <span className="font-medium text-slate-900">{item.description || '-'}</span>
                ) : (
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                    placeholder="Description"
                    className="w-full border-none focus:ring-0 p-0"
                  />
                )}
              </td>
              <td className="p-4 text-center">
                {readOnly ? (
                  item.qty
                ) : (
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => handleUpdateItem(idx, 'qty', parseInt(e.target.value) || 0)}
                    className="w-full text-center border-none focus:ring-0 p-0"
                  />
                )}
              </td>
              <td className="p-4 text-right">
                {readOnly ? (
                  `$${item.unit_price.toFixed(2)}`
                ) : (
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleUpdateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-full text-right border-none focus:ring-0 p-0"
                  />
                )}
              </td>
              <td className="p-4 text-right font-medium text-slate-900">
                ${(item.qty * item.unit_price).toFixed(2)}
              </td>
              {!readOnly && (
                <td className="p-4 text-center">
                  <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600">✕</button>
                </td>
              )}
            </tr>
          ))}
          <tr className="bg-slate-50/50 font-semibold text-slate-900 border-t-2 border-slate-200">
            <td colSpan={3} className="p-4 text-right">Total:</td>
            <td className="p-4 text-right">${total.toFixed(2)}</td>
            {!readOnly && <td></td>}
          </tr>
        </tbody>
      </table>
      {!readOnly && (
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleAddItem} className="text-sm text-blue-600 font-medium hover:text-blue-700">
            + Add Line Item
          </button>
        </div>
      )}
    </div>
  )
}
