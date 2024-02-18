const makeMealObj = (data) => {
    let ingredientsResult = [];

    for (let i = 1; i <= 20; i++) {
        const ingredient = `strIngredient${i}`;
        const measurement = `strMeasure${i}`;
        if (data[ingredient]) {
            ingredientsResult.push(data[measurement] + ' ' + data[ingredient]);
        }
    }

    const meal = {
        name: data.strMeal,
        category: data.strCategory,
        area: data.strArea,
        instructions: data.strInstructions,
        thumbnail: data.strMealThumb,
        ingredients: ingredientsResult,
    };

    return meal;
};


const makeDrinkObj = (data) => {
    let ingredientsResult = [];

    for (let i = 1; i <= 15; i++) {
        const ingredient = `strIngredient${i}`;
        const measurement = `strMeasure${i}`;
        if (data[ingredient]) {
            ingredientsResult.push(data[measurement] + ' ' + data[ingredient]);
        }
    }

    const drink = {
        name: data.strDrink,
        category: data.strCategory,
        type: data.strAlcoholic,
        glass: data.strGlass,
        instructions: data.strInstructions,
        thumbnail: data.strDrinkThumb,
        ingredients: ingredientsResult,
    };

    return drink;
};


module.exports = {
    makeMealObj,
    makeDrinkObj
};