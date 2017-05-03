const last = require('lodash.last');
const compose = require('lodash.compose');
const keys = require('lodash.keys');
const nodeFetch = require('node-fetch');
const { normalize, schema } = require('normalizr');
const { createStore, combineReducers, applyMiddleware } = require('redux');

const initialState = {};

// -----------
// helpers
// -----------
const log = console.log.bind(console); /* eslint no-console:"off" */

const fetch = (url, onError, callBack) => {
    nodeFetch(url)
        .then(resp => {
            if (resp.status >= 300) {
                onError({ message: `response status ${resp.status}` });
                return {};
            }
            return resp.json();
        })
        .then(callBack)
        .catch(onError);
};

const normalizer = (data = []) => {
    const Ingredients = new schema.Entity('ingredients');
    const Recipes = new schema.Entity('recipes', {
        ingredients: [Ingredients]
    });
    const RecipesSchema = new schema.Array(Recipes);
    const normalizedData = normalize(data.recipes, RecipesSchema);

    return ({
        ingredients: normalizedData.entities.ingredients,
        recipes: normalizedData.entities.recipes,
        result: normalizedData.result
    });
};

const inc = value => value + 1;

// ------------
// constants
// ------------
const ADD_RECIPE = 'add.recipe';
const ADD_INGREDIENT = 'add.ingredient';
const FETCH_RECIPES = 'fetch.recipes';
const SET_RECIPES = 'set.recipes';
const API_STARTS = 'api.starts';
const API_DONE = 'api.done';

// ------------------
// actions creators
// ------------------
const addRecipe = ({ name, id }) => ({
    type: ADD_RECIPE,
    payload: {
        name,
        id
    }
});

const addIngredient = ({ name, id, recipe_id, quantity }) => ({
    type: ADD_INGREDIENT,
    payload: {
        name,
        id,
        recipe_id,
        quantity
    }
});

const fetchRecipes = baseUrl => ({
    type: FETCH_RECIPES,
    payload: {
        url: `${baseUrl}/api/recipes`,
        success: SET_RECIPES
    }
});

const apiStarts = () => ({ type: API_STARTS });
const apiDone = () => ({ type: API_DONE });

// ------------
// middlewares
// ------------
const logMiddleware = () => next => action => {
    log(`Action: ${action.type}`);
    next(action);
};

const apiMiddleware = ({ dispatch }) => next => action => {
    if (action.type === FETCH_RECIPES) {
        dispatch(apiStarts());
        fetch(
            action.payload.url,
            error => log(`FETCH_RECIPES ->  ${error.message}`),
            data => {
                dispatch(apiDone());
                dispatch({
                    type: action.payload.success,
                    payload: normalizer(data.books)
                });
            });
    }
    next(action);
};

// ------------
// reducers
// ------------
const result = function idsReducer(state = [], action) {
    const actions = {
        [SET_RECIPES]: () => state.concat(action.payload.result),
        [ADD_RECIPE]: () => state.concat(action.payload.id),
        DEFAULT: () => state
    };
    const doAction = actions[action.type] || actions.DEFAULT;

    return doAction();
};

const recipes = function recipesReducer(state = {}, action) {
    const actions = {
        [SET_RECIPES]: () => action.payload.recipes,
        [ADD_RECIPE]: () => Object.assign({}, state, {
            [action.payload.id]: {
                id: action.payload.id,
                name: action.payload.name,
                ingredients: []
            }
        }),
        [ADD_INGREDIENT]: () => {
            const recipe = state[action.payload.recipe_id];

            recipe.ingredients = recipe.ingredients.concat(action.payload.id);
            return Object.assign({}, state, {
                [action.payload.recipe_id]: recipe
            });

        },
        DEFAULT: () => state
    };
    const doAction = actions[action.type] || actions.DEFAULT;

    return doAction();
};

const ingredients = function ingredientsReducer(state = {}, action) {
    const actions = {
        [SET_RECIPES]: () => action.payload.ingredients,
        [ADD_INGREDIENT]: () => Object.assign({}, state, {
            [action.payload.id]: {
                id: action.payload.id,
                recipe_id: action.payload.recipe_id,
                name: action.payload.name,
                quantity: action.payload.quantity
            }
        }),
        DEFAULT: () => state
    };
    const doAction = actions[action.type] || actions.DEFAULT;

    return doAction();
};

const requests = function uiReducer(state = 0, action) {
    const actions = {
        [API_STARTS]: () => state + 1,
        [API_DONE]: () => state - 1,
        DEFAULT: () => state
    };

    const doAction = actions[action.type] || actions.DEFAULT;

    return doAction();
};

const rootReducer = combineReducers({
    result,
    recipes,
    ingredients,
    requests
});

// -------------
// store
// -------------
const store = createStore(
    rootReducer,
    initialState,
    applyMiddleware(logMiddleware, apiMiddleware)
);

// -------------
// app
// -------------
const getIngredients = () => store.getState().ingredients;
const getResult = () => store.getState().result;
const secureValue = value => value >= 1 ? value : 0; /* eslint  no-confusing-arrow: "off" */

const getRecipeId = compose(
    inc,
    secureValue,
    last,
    getResult
);

const getIngredientId = compose(
    inc,
    secureValue,
    parseInt,
    last,
    keys,
    getIngredients
);

const createRecipe = ({ name = '', ingredientsList = [] }) => {
    const recipeId = getRecipeId();

    store.dispatch(addRecipe({
        name,
        id: recipeId
    }));

    ingredientsList.forEach(ingredient => {
        const ingredientWithId = Object.assign({}, ingredient, {
            id: getIngredientId(),
            recipe_id: recipeId
        });

        store.dispatch(addIngredient(ingredientWithId));
    });
};

const fetchData = baseUrl => {
    store.dispatch(fetchRecipes(baseUrl));
};

module.exports = {
    fetchData,
    createRecipe,
    getIngredients,
    subscribe: fn => store.subscribe(fn),
    getResult: () => store.getState().result,
    getRecipes: () => store.getState().recipes,
    getRequests: () => store.getState().requests
};
