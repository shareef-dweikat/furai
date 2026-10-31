export const productFinishes = [
  { id: 'oak', name: 'Oak', hex: '#c4a882' },
  { id: 'walnut', name: 'Walnut', hex: '#6e4f32' },
  { id: 'linen', name: 'Linen', hex: '#f0e6d4' },
  { id: 'charcoal', name: 'Charcoal', hex: '#3f3a36' },
  { id: 'sage', name: 'Sage', hex: '#8a9a78' },
  { id: 'clay', name: 'Clay', hex: '#c46b4a' },
  { id: 'ink', name: 'Ink', hex: '#243044' },
  { id: 'ivory', name: 'Ivory', hex: '#f6f0e6' },
] as const

export type ProductFinishId = (typeof productFinishes)[number]['id']

export function finishForProductColor(color: string) {
  return productFinishes.find((finish) => finish.id === color) ?? productFinishes[0]
}

export function finishById(id: ProductFinishId) {
  return productFinishes.find((finish) => finish.id === id) ?? productFinishes[0]
}
