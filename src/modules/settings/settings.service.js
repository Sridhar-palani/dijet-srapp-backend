import Settings from "./settings.model.js";

export const getSettings = async () => {
  const settings = await Settings.findOne();
  return settings || { openingCash: 0, asOf: null, notes: "" };
};

export const updateOpeningBalance = async ({ openingCash, asOf, notes }) => {
  const settings = await Settings.findOneAndUpdate(
    {},
    { openingCash, asOf, notes },
    { upsert: true, new: true, runValidators: true }
  );
  return settings;
};
