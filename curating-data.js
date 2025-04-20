const fs = require("fs");

// Baca dan parse file JSON
const data = JSON.parse(fs.readFileSync("data-merged.json", "utf-8"));

// Helper konversi harga
const parsePrice = (str) => Number(str.replace(/[^\d]/g, ""));
const parseRatingCount = (str) => parseInt(str?.replace(/[^\d]/g, "") || "0");

// Filter hanya drone
const isDrone = (title) => {
  const t = title.toLowerCase();
  return (
    t.includes("drone") &&
    !t.includes("tas") &&
    !t.includes("charger") &&
    !t.includes("baterai") &&
    !t.includes("power station")
  );
};

const filteredDrones = data.filter((item) => isDrone(item.title || ""));

// Simpan hasil filter awal
fs.writeFileSync("drone_curated.json", JSON.stringify(filteredDrones, null, 2));
console.log(`Tersimpan ${filteredDrones.length} drone ke drone_curated.json`);

// Kurasi kualitas bagus & harga kompetitif
const curatedDrones = filteredDrones
  .filter((item) => {
    const rating = parseFloat(item.productRating || "0");
    const ratingCount = parseRatingCount(item.productRatingCounter);
    const price = parsePrice(item.price || "0");

    return rating >= 4.5 && ratingCount >= 20 && price >= 1e6 && price <= 1e7;
  })
  .sort((a, b) => {
    const scoreA =
      parsePrice(a.price) / (parseRatingCount(a.productRatingCounter) || 1);
    const scoreB =
      parsePrice(b.price) / (parseRatingCount(b.productRatingCounter) || 1);
    return scoreA - scoreB;
  });

// Simpan hasil seleksi
fs.writeFileSync("drone_selected.json", JSON.stringify(curatedDrones, null, 2));
console.log(
  `Tersimpan ${curatedDrones.length} drone terpilih ke drone_selected.json`
);
