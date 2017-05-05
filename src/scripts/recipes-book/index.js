const {
    createRecipe,
    fetchData,
    getResult,
    getRecipes,
    getIngredients,
    getRequests,
    subscribe
} = require('./recipes-app');

const log = console.log.bind(console); /* eslint no-console:"off" */

const updateRecipes = () => {

    log('updated state result: \n', getResult(), '\n ==============');
    log('updated state recipes: \n', getRecipes(), '\n ==============');
    log('updated state ingredients: \n', getIngredients(), '\n ==============');
    log('updated state requests: \n', getRequests(), '\n ==============');
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
