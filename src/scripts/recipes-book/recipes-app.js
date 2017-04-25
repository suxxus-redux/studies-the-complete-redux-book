const last = require('lodash.last');
const compose = require('lodash.compose');
const keys = require('lodash.keys');
const nodeFetch = require('node-fetch');
const { createStore, combineReducers, applyMiddleware } = require('redux');

const initialState = {};

// -----------
// helpers
// -----------
const fetchRecipesData = (url, callBack) => {
    nodeFetch(url)
        .then(resp => resp.json())
        .then(json => {
            callBack(json);
        })
        .catch(error => {
            console.log('error--> ', error.message);
        });
};

// ------------
// constants
// ------------
const ADD_RECIPE = 'add.recipe';
const ADD_INGREDIENT = 'add.ingredient';
const FETCH_RECIPES = 'fetch.recipes';
const SET_RECIPES = 'set.recipes';

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

const fetchRecipes = url => ({
    type: FETCH_RECIPES,
    payload: url
});

const setRecipes = data => ({
    type: SET_RECIPES,
    payload: data
});

// ------------
// middlewares
// ------------
const logMiddleware = () => next => action => {
    console.log(`Action: ${action.type}`);
    next(action);
};

const fetchDateMiddleware = ({ dispatch }) => next => action => {
    if (action.type === FETCH_RECIPES) {
        fetchRecipesData(action.payload, data => dispatch(setRecipes(data)));
    }
    next(action);
};

// ------------
// reducers
// ------------
const results = function idsReducer(state = [], action) {
    const actions = {
        [SET_RECIPES]: () => action.payload.results,
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

const rootReducer = combineReducers({
    results,
    recipes,
    ingredients
});

// -------------
// store
// -------------
const store = createStore(
    rootReducer,
    initialState,
    applyMiddleware(logMiddleware, fetchDateMiddleware)
);

// -------------
// app
// -------------
const inc = value => value + 1;
const getIngredients = () => store.getState().ingredients;
const getResult = () => store.getState().results;

const getRecipeId = compose(
    inc,
    last,
    getResult
);

const getIngredientId = compose(
    inc,
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

const fetchData = url => {
    store.dispatch(fetchRecipes(url));
};

module.exports = {
    fetchData,
    createRecipe,
    subscribe: fn => store.subscribe(fn),
    getRecipes: () => store.getState().recipes
};
