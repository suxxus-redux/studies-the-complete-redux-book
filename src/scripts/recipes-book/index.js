const {
    createRecipe,
    fetchRecipesData,
    cancelFetchRecipes,
    getState,
    setApiKey,
    openWS,
    closeWS,
    subscribe
} = require('./recipes-app');

const log = console.log.bind(console); /* eslint no-console:"off" */

const updateRecipes = () => {
    log('state --> \n', getState(), '\n ==============');
};

// -------------------
// recipes App
// -------------------
const fetchRecipes = baseUrl => {
    fetchRecipesData(baseUrl);
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
    openWS,
    closeWS,
    fetchRecipes,
    cancelFetchRecipes,
    createGuacamoleRecipe
};
