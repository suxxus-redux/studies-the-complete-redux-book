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

const log = console.log.bind(console); // eslint-disable-line no-console

const subscriber = () => {
    log('state --> \n', getState(), '\n ==============');
};

// -------------------
// recipes App
// -------------------
const fetchRecipes = baseUrl => {
    fetchRecipesData(baseUrl);
};

// subscribe for changes
subscribe(subscriber);

module.exports = {
    setApiKey,
    openWS,
    closeWS,
    cancelFetchRecipes,
    fetchRecipes,
    createRecipe
};
