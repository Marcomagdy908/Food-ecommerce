const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/slicecraft';

const MealSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String },
  tags: [String],
  isAvailable: { type: Boolean, default: true }
});

const Meal = mongoose.model('Meal', MealSchema);

const defaultMeals = [
  {
    title: 'La Bufalina',
    description: 'Buffalo mozzarella, San Marzano D.O.P. tomatoes, fresh basil, extra virgin olive oil.',
    price: 22.00,
    category: 'Pizzas',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3N8yp_nRPV1SKOewLjBEOF7pn9Ho3pJXFXktHhh1WOfNPPVjIdq9ZDdhXBDxNhzmrui1dESMLSAek3qcrCd1EP67kt25vBurE5vDdC70tYo2IkHxuK01YHU-RKc-cU93IB3nkbEgQuLdlLLnYwzL30xbgG3OcZiLmXZHHr0aR0WpidoBVwt1UWsZhJB-TQsKKzaCFc94tnASJnd4tF_ZVVSBYWBTDn_AAkYYv6SckW4S_ytQs9F2FFbOD71lyCZjs4V2VFBD8iS8',
    tags: ['Vegetarian', "Chef's Choice"],
    isAvailable: true
  },
  {
    title: 'Prosciutto e Rucola',
    description: 'Prosciutto di Parma, wild arugula, Parmigiano Reggiano, fior di latte.',
    price: 24.00,
    category: 'Pizzas',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2jPa-WQHtybLh0WyNcW9KFPOFTlrjc82opFlje9Csu_ehVH0DgLBPP_V78K2OuisbtzMy1Fnty1KD3in3l2o2KeqzCBWrUA5KfO4lh1a7DcbGYGquoH_l07nElPgCLuUFrETyu6StNHabKIT9kdYaQEbsQ_m3jCCO7PeNCafAAQ2YIgFv1gZCS7STWDilerdjuSQ6W__rWjxlmOoKJpt1rnDp-h4QH1iSkAUX_20IB31kFVvi5q-MvjPm9qbyb8YHmb72gzcid6k',
    tags: ['Staff Favorite'],
    isAvailable: true
  },
  {
    title: 'Tartufo Nero',
    description: 'Black truffle cream, wild mushrooms, fresh mozzarella, truffle oil, chives.',
    price: 28.00,
    category: 'Pizzas',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEFbTyNyEaN_VqChoEOhhREe7a6Fp8smCwwAMhKkXR7dD-QymX4_NOMQ40QcCbEZv53c3TGHedaALWI-Ex2q_fCKaIb95pEHoZZzzmVE92vIIqTUWE1JV3iR7JTfkO8x04RR32QZ4Y6-oJSr9krO5K1YOjPFnPR6IdpekXMLCBc6J49PA-KDwjQAOjt45mCnvUumsJz8l5WSqBZXb3MsZ-O1AWgcQQ1lkTOtOs8p88hRWmDGA79BXtYFJsWq_B555wIEwR2f9pzjg',
    tags: ['Vegetarian', 'Premium'],
    isAvailable: true
  },
  {
    title: 'Artisanal Tagliatelle',
    description: 'Freshly made pasta noodles tossed in a rich, velvety tomato cream sauce, parmesan, and basil.',
    price: 19.00,
    category: 'Pastas',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHAB-KICqKgroTBeMhHBy7xlyjNIqXz7-MzQ-Aruc71PVWkzwYtlgksRSEd6iNPrJVl1aWwetcx3P4lFWBwZVBsO8maNgE_PXtZS0Yo_rfVXWExnBkX4K2TbYD2o4U7F1DbLxGzAJTtjtJMOpJBR7bgnBurVL0qSGdYO9sgfGFbtNcPMP3IsPNI9ZGMaN93FC1yRKgYUZf2cbsque1xYXH8b0BhOTKajqfC9Y-khj-bXk3K9tDG99zklcqcuiWOiandOA1SadQIiY',
    tags: ['Artisanal', 'Popular'],
    isAvailable: true
  },
  {
    title: 'Classic Antipasti Board',
    description: 'Prosciutto di Parma, creamy Burrata topped with pesto, roasted red peppers, and green Castelvetrano olives.',
    price: 21.00,
    category: 'Antipasti',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpCjOlbcWh2VtkBk_ObZ3xeVmWPHJtIhQy_OXYKgIcu3E87N8J_8c0_Jw5iK7Mg0gBA8obsM0COWx_fzLeSn2RnLtbeJTpUw9DWd0bDMQhCmiANqaDabaiWauoPt5P67f1vcSqTLjmIanTQx-AcDHWUfWs0n2TxBXG3F1UClEpXox6HrODy_VJLzaD9Nh3wAOj28pSG3oGpzu9cDELJwiw6AW4hqPv8uK8LgHNWlcWKnZIf6wRGgmWiYSIZ93aRWa4_wu_sXlp67M',
    tags: ['Shareable'],
    isAvailable: true
  },
  {
    title: 'Chianti Classico',
    description: 'A glass of deep red Chianti wine, perfect pairing for Neapolitan wood-fired crust.',
    price: 12.00,
    category: 'Drinks',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbWxxH-FG5Dzo5CbkMeqkvjzzULUmjdBh8zSU_taHlnO4ehzmeZzgJLKsWR9pQf7ykpCj4TL0_ObOCRDGhWByJsb1N11xDjEWE7kTM59chb9YrJr1eBOMH8ssl6LN-3GBycguimT3LfVfyivkR-fQY66CHOvCOuez5jjxJC9cXfGBWcQTq7Dva44Fe7Dt7Es9_EhY2ikzvVi0G2E8agzarE-fy5HSoMAw_DuU0cn9WWSwV9pX0soI3COnI3Hk3d0u21ClIfNexxIE',
    tags: ['Chianti', 'Premium'],
    isAvailable: true
  }
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connection successful. Seeding database...');

    await Meal.deleteMany({});
    await Meal.insertMany(defaultMeals);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
