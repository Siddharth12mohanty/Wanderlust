const coords = listing.geometry?.coordinates || [85.8245, 20.2961];

const map = L.map("map").setView(
    [coords[1], coords[0]],
    13
);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);

L.marker([coords[1], coords[0]])
.addTo(map)
.bindPopup(`
    <b>${listing.title}</b><br>
    Exact Location will be provided after booking
`)
.openPopup();