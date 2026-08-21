import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { success } from '../utils/apiResponse.js';

export const getSavedAddresses = async (req, res) => {
  const user = await User.findById(req.user._id).select('addresses').lean();
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  return success(res, user.addresses || [], 'Saved addresses fetched');
};

export const addSavedAddress = async (req, res) => {
  const {
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country = 'India',
    landmark,
    isDefault
  } = req.body;

  if (!fullName || !String(fullName).trim()) {
    return res.status(400).json({ success: false, message: 'Full Name is required' });
  }

  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ success: false, message: 'Valid 10-digit phone number is required' });
  }

  if (!addressLine1 || !String(addressLine1).trim()) {
    return res.status(400).json({ success: false, message: 'Address Line 1 is required' });
  }

  if (!city || !String(city).trim()) {
    return res.status(400).json({ success: false, message: 'City is required' });
  }

  if (!state || !String(state).trim()) {
    return res.status(400).json({ success: false, message: 'State is required' });
  }

  const cleanPostalCode = String(postalCode || '').replace(/[^0-9]/g, '');
  if (cleanPostalCode.length !== 6) {
    return res.status(400).json({ success: false, message: 'Valid 6-digit postal code / PIN is required' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (!Array.isArray(user.addresses)) {
    user.addresses = [];
  }

  const shouldBeDefault = Boolean(isDefault) || user.addresses.length === 0;

  if (shouldBeDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  const newAddress = {
    fullName: String(fullName).trim(),
    phone: cleanPhone,
    addressLine1: String(addressLine1).trim(),
    addressLine2: String(addressLine2 || '').trim(),
    city: String(city).trim(),
    state: String(state).trim(),
    postalCode: cleanPostalCode,
    country: String(country || 'India').trim(),
    landmark: String(landmark || '').trim(),
    isDefault: shouldBeDefault
  };

  user.addresses.push(newAddress);
  await user.save();

  const savedAddr = user.addresses[user.addresses.length - 1];
  return success(res, { address: savedAddr, addresses: user.addresses }, 'Address saved successfully', 201);
};

export const updateSavedAddress = async (req, res) => {
  const { addressId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    return res.status(400).json({ success: false, message: 'Invalid address ID' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const addr = user.addresses.id(addressId);
  if (!addr) {
    return res.status(404).json({ success: false, message: 'Address not found' });
  }

  const {
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    landmark,
    isDefault
  } = req.body;

  if (fullName !== undefined) {
    if (!String(fullName).trim()) {
      return res.status(400).json({ success: false, message: 'Full Name cannot be empty' });
    }
    addr.fullName = String(fullName).trim();
  }

  if (phone !== undefined) {
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone number is required' });
    }
    addr.phone = cleanPhone;
  }

  if (addressLine1 !== undefined) {
    if (!String(addressLine1).trim()) {
      return res.status(400).json({ success: false, message: 'Address Line 1 cannot be empty' });
    }
    addr.addressLine1 = String(addressLine1).trim();
  }

  if (addressLine2 !== undefined) addr.addressLine2 = String(addressLine2 || '').trim();
  if (city !== undefined) {
    if (!String(city).trim()) return res.status(400).json({ success: false, message: 'City cannot be empty' });
    addr.city = String(city).trim();
  }
  if (state !== undefined) {
    if (!String(state).trim()) return res.status(400).json({ success: false, message: 'State cannot be empty' });
    addr.state = String(state).trim();
  }
  if (postalCode !== undefined) {
    const cleanPostal = String(postalCode).replace(/[^0-9]/g, '');
    if (cleanPostal.length !== 6) return res.status(400).json({ success: false, message: 'Valid 6-digit postal PIN is required' });
    addr.postalCode = cleanPostal;
  }
  if (country !== undefined) addr.country = String(country || 'India').trim();
  if (landmark !== undefined) addr.landmark = String(landmark || '').trim();

  if (isDefault !== undefined && Boolean(isDefault)) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
    addr.isDefault = true;
  }

  await user.save();
  return success(res, { address: addr, addresses: user.addresses }, 'Address updated successfully');
};

export const deleteSavedAddress = async (req, res) => {
  const { addressId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    return res.status(400).json({ success: false, message: 'Invalid address ID' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const addr = user.addresses.id(addressId);
  if (!addr) {
    return res.status(404).json({ success: false, message: 'Address not found' });
  }

  const wasDefault = addr.isDefault;
  user.addresses.pull({ _id: addressId });

  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  return success(res, user.addresses, 'Address deleted successfully');
};

export const setDefaultAddress = async (req, res) => {
  const { addressId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    return res.status(400).json({ success: false, message: 'Invalid address ID' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const targetAddr = user.addresses.id(addressId);
  if (!targetAddr) {
    return res.status(404).json({ success: false, message: 'Address not found' });
  }

  user.addresses.forEach((a) => {
    a.isDefault = String(a._id) === String(addressId);
  });

  await user.save();
  return success(res, user.addresses, 'Default address updated');
};
