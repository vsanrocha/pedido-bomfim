// Cart singleton store — emits "cart:change" CustomEvent on every mutation
const state = {
  kits: [],
  avulsoItems: [],
};

function emit() {
  window.dispatchEvent(new CustomEvent("cart:change", { detail: getState() }));
}

export function getState() {
  return {
    kits: [...state.kits],
    avulsoItems: [...state.avulsoItems],
  };
}

export function addKit(kitData) {
  const existing = state.kits.find((k) => k.id === kitData.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.kits.push({ ...kitData, quantity: 1 });
  }
  emit();
}

export function removeKit(id) {
  state.kits = state.kits.filter((k) => k.id !== id);
  emit();
}

export function updateKitQty(id, quantity) {
  if (quantity <= 0) {
    removeKit(id);
    return;
  }
  const kit = state.kits.find((k) => k.id === id);
  if (kit) {
    kit.quantity = quantity;
    emit();
  }
}

export function addAvulso(itemData) {
  const existing = state.avulsoItems.find((i) => i.id === itemData.id);
  if (existing) {
    existing.quantity += itemData.quantity ?? 1;
  } else {
    state.avulsoItems.push({ ...itemData, quantity: itemData.quantity ?? 1 });
  }
  emit();
}

export function removeAvulso(id) {
  state.avulsoItems = state.avulsoItems.filter((i) => i.id !== id);
  emit();
}

export function updateAvulsoQty(id, quantity) {
  if (quantity <= 0) {
    removeAvulso(id);
    return;
  }
  const item = state.avulsoItems.find((i) => i.id === id);
  if (item) {
    item.quantity = quantity;
    emit();
  }
}

export function clearCart() {
  state.kits = [];
  state.avulsoItems = [];
  emit();
}

export function getTotals() {
  const kitsTotal = state.kits.reduce((s, k) => s + k.kitPrice * k.quantity, 0);
  const avulsoTotal = state.avulsoItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount =
    state.kits.reduce((s, k) => s + k.quantity, 0) +
    state.avulsoItems.reduce((s, i) => s + i.quantity, 0);
  return { kitsTotal, avulsoTotal, total: kitsTotal + avulsoTotal, itemCount };
}
