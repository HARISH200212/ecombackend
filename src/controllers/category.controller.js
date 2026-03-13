const categories = [
    { id: 0, name: "New Arrivals", special: true },
    { id: 1, name: "Gadgets & More" },
    { id: 2, name: "Gimbals & Mic" },
    { id: 3, name: "Cables" },
    { id: 4, name: "Air pods" },
    { id: 5, name: "Watches" },
    { id: 6, name: "Speakers" },
    { id: 7, name: "Home & Living" },
    { id: 8, name: "Next-Gen Toys" }
];

exports.getCategories = (req, res) => {
    res.json(categories);
};
