const {
    createRecipe,
    fetchData,
    getResult,
    getRecipes,
    getIngredients,
    getRequests,
    subscribe
} = require('./recipes-app');

const updateRecipes = () => {
    console.log('updated state result: \n', getResult(), '\n ==============');
    console.log('updated state recipes: \n', getRecipes(), '\n ==============');
    console.log('updated state ingredients: \n', getIngredients(), '\n ==============');
    console.log('updated state requests: \n', getRequests(), '\n ==============');
};

// -------------------
// recipes App
// -------------------
const fetchRecipesData = () => {
    fetchData('http://localhost:4000');
};

const createGuacamoleRecipe = () => {
    createRecipe({
        name: 'Guacamole',
        ingredientsList: [{
            name: 'advocado',
            quantity: 1
        }, {
            name: 'lemon',
            quantity: '1/2'
        }]
    });
};

// subscribe for changes
subscribe(updateRecipes);

module.exports = {
    fetchRecipesData,
    createGuacamoleRecipe
};
