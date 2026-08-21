const toNumber = (value) => Number(value);

export const validateCreateProduct = (req) => {
  const errors = [];
  const { name, description, category, price, stock, minOrderQuantity, discount } = req.body;

  if (!name || String(name).trim().length < 2) errors.push('Product name is required');
  if (!description || String(description).trim().length < 10) errors.push('Description must be at least 10 characters');
  if (!category || String(category).trim().length < 2) errors.push('Category is required');
  if (price == null || Number.isNaN(toNumber(price)) || toNumber(price) < 0) errors.push('Price must be a valid number');
  if (stock == null || Number.isNaN(toNumber(stock)) || toNumber(stock) < 0) errors.push('Stock must be a valid number');
  if (minOrderQuantity != null && (Number.isNaN(toNumber(minOrderQuantity)) || toNumber(minOrderQuantity) < 1)) {
    errors.push('Minimum order quantity must be at least 1');
  }
  if (discount != null && (Number.isNaN(toNumber(discount)) || toNumber(discount) < 0 || toNumber(discount) > 100)) {
    errors.push('Discount must be between 0 and 100');
  }

  return errors;
};

export const validateUpdateProduct = (req) => {
  const errors = [];
  const allowedFields = [
    'name',
    'description',
    'category',
    'price',
    'discount',
    'stock',
    'minOrderQuantity',
    'sku',
    'isActive',
    'isFeatured',
    'isBestSeller',
    'unit',
    'packSize',
    'badge',
    'tags',
    'imageUrl',
    'availabilityStatus'
  ];
  const hasUpdatableField = allowedFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field));

  if (!hasUpdatableField && !req.file) {
    errors.push('At least one updatable field is required');
    return errors;
  }

  if (req.body.name != null && String(req.body.name).trim().length < 2) errors.push('Product name is too short');
  if (req.body.description != null && String(req.body.description).trim().length < 10) {
    errors.push('Description must be at least 10 characters');
  }
  if (req.body.category != null && String(req.body.category).trim().length < 2) errors.push('Category is required');
  if (req.body.price != null && (Number.isNaN(toNumber(req.body.price)) || toNumber(req.body.price) < 0)) {
    errors.push('Price must be a valid number');
  }
  if (req.body.stock != null && (Number.isNaN(toNumber(req.body.stock)) || toNumber(req.body.stock) < 0)) {
    errors.push('Stock must be a valid number');
  }
  if (req.body.minOrderQuantity != null && (Number.isNaN(toNumber(req.body.minOrderQuantity)) || toNumber(req.body.minOrderQuantity) < 1)) {
    errors.push('Minimum order quantity must be at least 1');
  }
  if (req.body.discount != null && (Number.isNaN(toNumber(req.body.discount)) || toNumber(req.body.discount) < 0 || toNumber(req.body.discount) > 100)) {
    errors.push('Discount must be between 0 and 100');
  }

  return errors;
};
