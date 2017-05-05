const {
    createRecipe,
    fetchData,

    // getResult,
    // getRecipes,
    // getIngredients,
    // getRequests,
    // getRequestsError,
    getState,
    setApiKey,
    subscribe
} = require('./recipes-app');

const log = console.log.bind(console); /* eslint no-console:"off" */

const updateRecipes = () => {

    // log('state --> result: \n', getResult(), '\n ==============');
    // log('state --> recipes: \n', getRecipes(), '\n ==============');
    // log('state --> ingredients: \n', getIngredients(), '\n ==============');
    // log('state --> requestsError: \n', getRequestsError(), '\n ==============');
    // log('state --> requests: \n', getRequests(), '\n ==============');
    log('state --> \n', getState(), '\n ==============');
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
    setApiKey,
    fetchRecipesData,
    createGuacamoleRecipe
};
