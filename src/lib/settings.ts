export const SETTINGS = {
  strength: {
    strongMin: 70,
    fairMin: 50,
    maxFrames: 10,
  },
  stores: {
    lowRatio: 0.6,
  },
  queen: {
    breeds: ['Carniolan', 'Italian'] as const,
    yearRange: { min: 2020, max: new Date().getFullYear() },
    oldAge: 3,
  },
  feed: {
    types: ['sugar syrup', 'fondant', 'pollen patty', 'dry sugar', 'other'] as const,
  },
  treatment: {
    products: ['Apivar', 'Apitraz', 'Bayvarol', 'oxalic acid', 'formic acid', 'thymol', 'other'] as const,
  },
  box: {
    types: ['brood', 'super'] as const,
  },
  cost: {
    categories: ['feed', 'treatment', 'transport', 'equipment', 'labour', 'other'] as const,
  },
  flowering: {
    plants: [
      { name: 'Manuka', months: [11, 12, 1, 2], colour: '#8B4513' },
      { name: 'Kanuka', months: [10, 11, 12, 1], colour: '#6B8E23' },
      { name: 'Clover', months: [11, 12, 1, 2, 3], colour: '#DAA520' },
      { name: 'Pohutukawa', months: [12, 1], colour: '#DC143C' },
      { name: 'Rata', months: [12, 1, 2], colour: '#B22222' },
      { name: 'Kamahi', months: [10, 11, 12], colour: '#556B2F' },
      { name: 'Rewarewa', months: [10, 11], colour: '#CD853F' },
      { name: 'Willow', months: [8, 9, 10], colour: '#9ACD32' },
    ],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  shop: {
    categories: ['Feed', 'Treatments', 'Equipment', 'Protective gear'] as const,
    products: [
      { id: '1', name: 'Sugar Syrup (20L)', category: 'Feed', price: 28, supplier: 'Farmlands' },
      { id: '2', name: 'Pollen Patty (1kg)', category: 'Feed', price: 12, supplier: 'Ecrotek' },
      { id: '3', name: 'Fondant (12.5kg)', category: 'Feed', price: 35, supplier: 'Farmlands' },
      { id: '4', name: 'Apivar Strips (10pk)', category: 'Treatments', price: 62, supplier: 'Ecrotek' },
      { id: '5', name: 'Apitraz Strips (10pk)', category: 'Treatments', price: 55, supplier: 'Ceracell' },
      { id: '6', name: 'Bayvarol Strips (4pk)', category: 'Treatments', price: 38, supplier: 'Ecrotek' },
      { id: '7', name: 'Oxalic Acid (500g)', category: 'Treatments', price: 24, supplier: 'BeeQuip' },
      { id: '8', name: 'Full Depth Super (unassembled)', category: 'Equipment', price: 22, supplier: 'Ceracell' },
      { id: '9', name: 'Three Quarter Super', category: 'Equipment', price: 18, supplier: 'Ceracell' },
      { id: '10', name: 'Frames (10pk)', category: 'Equipment', price: 32, supplier: 'Ecrotek' },
      { id: '11', name: 'Foundation Wax (10 sheets)', category: 'Equipment', price: 28, supplier: 'Ceracell' },
      { id: '12', name: 'Queen Excluder', category: 'Equipment', price: 16, supplier: 'Ecrotek' },
      { id: '13', name: 'Hive Tool (J-type)', category: 'Equipment', price: 14, supplier: 'BeeQuip' },
      { id: '14', name: 'Smoker (stainless)', category: 'Equipment', price: 65, supplier: 'Ecrotek' },
      { id: '15', name: 'Bee Suit (full)', category: 'Protective gear', price: 145, supplier: 'Ecrotek' },
      { id: '16', name: 'Gloves (leather, pair)', category: 'Protective gear', price: 26, supplier: 'BeeQuip' },
    ],
  },
} as const;
