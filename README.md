# *DreamHost*
## Site Link

## API Links

### Meals
[https://www.themealdb.com/api.php](https://www.themealdb.com/api.php)
### Drinks
[https://www.thecocktaildb.com/api.php](https://www.thecocktaildb.com/api.php)

## Application
The purpose of this app is to allow users access to a database full of different recipes for both *meals* and *drinks*.  
In addition to this, they can create and store their own personal recipes.   
I've chosen to gather my information from two different APIs:  

- **TheMealDB**  
- **TheCocktailDB**


**Application built using a JavaScript stack:**  
- JavaScript  
- React.js  
- Node.js  
- Express.js  

**Styling done with:**  
- Bootstrap  
- CSS  


## Tests
Test files are located in the same folder as the JS file that they are testing.  
You can run all tests with `npm test` or individually with `npm test test_file_name`


## User Flow
When first opening the application, the user is welcomed with the message: **"Welcome To DreamHost"**.  
If the user already has a profile, they can log in through the **Login** link in the **NavBar**.  
If not, they can sign up using the **Sign Up** link.  

After creating a user profile or logging in, users are welcomed with a personalized welcome message on the **Home** page.  

From here, the user has the following options available to them in the **NavBar**:

- ***Recipes Dropdown:***
	- **Meals**(*list of all meals*)
	- **Drinks**(*list of all drinks*)
	- **Meal Categories**(*list of meal categories*)
	- **Drink Categories**(*list of drink categories*)
- ***Personal Dropdown:***
	- **Create Meal**(*form to create a personal meal*)
	- **Create Drink**(*form to create a personal drink*)
	- **Personal Meals**(*list of personal meals already created*)
	- **Personal Drinks**(*list of personal drinks already created*)
- ***Profile:***
	- form that shows user profile information, with the ability to update it
- ***Logout:***
	- logs out the user


### Recipes Dropdown
#### `Meals`/`Drinks`
When the user clicks on **Meals** or **Drinks**, they are taken to a list of all the respective recipes available in the database.  
On this page there is a **Search** form that allows the user to search for recipes by name.  
There are also two buttons directly below the search form:

- A `Filter by Category` button, which takes the user to the list of respective page's categories
- A `Show Favorites` button, which takes the user to a list of recipes, of that specific type, that they have favorited
	- when clicked, the button changes to a `Back to All Meals` or `Back to All Drinks` button(*depending on whether the user is on the **Meals** or **Drinks** page*)

#### `Meal Categories`/`Drink Categories`
When the user clicks on **Meal Categories** or **Drink Categories**, they are taken to the list of the respective categories available.  

Each **Category** is displayed on a link that shows the category *name* and a *count* for how many recipes are in that category.  

Clicking on a category will take the user to a list of all recipes that are in that category.  

##### Recipes List:
Each recipe that is listed on the page is shown as a link, which provides a picture and minimal information for the recipe:

- for **Meals**:
	- name
	- area(*where the meal is from*)
	- ingredients list
- for **Drinks**:
	- name
	- type(*Alcoholic or Non-Alcoholic*)
	- ingredients list

When a recipe is clicked on, the user is taken to a full details page for that recipe.  
Included on this page is:

- for **Meals**:
	- Name
	- Area
	- Category
	- Ingredients
	- Instructions
- for **Drinks**:
	- Name
	- Type
	- Glass to serve in
	- Category
	- Ingredients
	- Instructions
- a heart icon, which, when clicked, adds/removes the recipe to/from the user's favorites list.


### Personal Dropdown
#### `Create Meal`/`Create Drink`
When the user clicks on **Create Meal** or **Create Drink**, they are taken to a form to create a personal respective recipe.
> ***It's important to note that the recipes created here will only be visible to the user that created them***

The input fields on this form are as follows:

- for **Meals**:
	- Name
	- Category
	- Area
	- Instructions
	- Thumbnail(*optional field for an image of the recipe*)
	- Ingredients list
	- form to add an ingredient to the list
- for **Drinks**:
	- Name
	- Category
	- Type(*Radio field with options for either Alcoholic or Non-Alcoholic*)
	- Glass(*optional field for recommended serving glass*)
	- Instructions
	- Thumbnail(*optional field for an image of the recipe*)
	- Ingredients list
	- form to add an ingredient to the list

Each ingredient in the ***Ingredients list*** has a trash icon next to it, to remove said ingredient from the list, if desired.  

When this form is submitted, the user is redirected to the **Home** page, and the recipe is added to either ***Personal Meals*** or ***Personal Drinks***, depending on the form that was submitted.

#### `Personal Meals`/`Personal Drinks`
When the user clicks on **Personal Meals** or **Personal Drinks**, they are taken to a list of respective *personal* recipes.  

This list is very similar to the *all* **Meals** or **Drinks** list, with the exception of the **Search** form, the `Filter by Category` button, and the `Show Favorites` button.  

***The recipes that are shown here are specific to the user that is logged in***  

When a recipe is clicked on, a full details page for that recipe is shown.  
This details page is identical to the details page for all other recipes, with the exception of the heart icon.  
Instead of the heart icon, an `Edit Recipe` button is shown, which, when clicked, takes the user to a form to update that specific recipe.


### Profile
When the user clicks on **Profile**, they are taken to a form that displays the user's profile information.  
Here, they have the option to update their profile, with the exception of the username.