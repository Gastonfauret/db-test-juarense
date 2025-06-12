export const Members = [
  {
    id: "member01",
    fullname: "Juan Fernandez",
    birthdate: "2005-04-22",
    discipline: [
      {
        id: "disc03",
        name: "Futbol Masculino",
        price: 4500,
      },
      { id: "disc01", name: "Hockey", price: 5000 },
    ],
    group: { id: "group02", description: "G2" },
    card: { id: "card01", file: "nombrearchivo1" },
  },

  {
    id: "member02",
    fullname: "Florentina Gomez",
    birthdate: "2000-01-06",
    discipline: [
      {
        id: "disc01",
        name: "Hockey",
        price: 5000,
      },
    ],
    group: { id: "group02", description: "G2" },
    card: {
      id: "card02",
      file: "nombrearchivo2",
    },
  },
];
