# Sustainable Charging

## 📋 Table of Contents

- [Motive](https://github.com/dannyfrelink/sustainable-charging#motive)
- [Assignment](https://github.com/dannyfrelink/sustainable-charging#assignment)
    * [User Stories](https://github.com/dannyfrelink/sustainable-charging#user-stories)
- [Concept](https://github.com/dannyfrelink/sustainable-charging#concept)
- [API](https://github.com/dannyfrelink/sustainable-charging#api)
- [Process (Wiki)](https://github.com/dannyfrelink/sustainable-charging#%EF%B8%8F-process-wiki)
- [Wishlist](https://github.com/dannyfrelink/sustainable-charging#-wishlist)
- [Installation](https://github.com/dannyfrelink/sustainable-charging#-installation)
- [License](https://github.com/dannyfrelink/sustainable-charging#-license)

## Motive

The Netherlands is rapidly switching to electric driving. But electricity is not yet fossil-free. And when you charge your electric car, you emit CO2. How much CO2 is released depends on where, when and of course how much energy (kWh) you charge. So how do you know how much CO2 is released when you plug your electric car into a specific charging station?

The Green Caravan has developed a data model that combines energy generation and trade across Europe with energy mixes from energy providers. For example, you can accurately request how much CO2, solar, wind, hydro, nuclear, coal, gas and more is in a charging session right down to the charging station. Green Caravan not only has historical data, but also forecasts for the near future.

## Assignment

Create a web application that gives insight into the usage of fossil fuels for charging sessions of electric cars.

### User Stories

1. Fossil electricity from charging station?
As an electric driver, I want to know how much fossil electricity comes from the charging station I am standing next to, so that I know how (un)sustainable it is.
Can we provide insight into this data and display it, for example, via a QR code on the charging station?

2. Find the best charging station
As an electric driver, I would like to know at which charging station I can charge most sustainably, so that I can charge my car as sustainable as possible.

3. Finding the best charging moment at a charging station
As an electric driver, I would like to know when the least fossil electricity comes from my charging station, so that I can charge my car as sustainable as possible.

## Concept

All the user stories above are kind of similar. Therefore, I wanted to try and target as many as possible to make a complete web application. The client wanted to see as many different prototypes as possible to get the most ideas for the future. Most of my fellow students were creating some sort of a map, so I tried to stay clear of that option. 

I chose to create a list with all charging stations in your area (with a max distance of 1500 meters). In this list, you can see the street of the station, how many meters away it is and the sustainability of it right now. By clicking on a station you get some extra information of it. You get to see the station operator, the energy provider, the current status and the maximum charging power. You can start navigating to the station with the button at the end of the extra information.

Articles closed        |  Articles open
:---------------------:|:---------------------:
![Articles closed](https://github.com/dannyfrelink/sustainable-charging/blob/main/public/images/readme/concept-articles-close.png) | ![Articles open](https://github.com/dannyfrelink/sustainable-charging/blob/main/public/images/readme/concept-articles-open.png)

With the basics all done, I started working on some extra features of my application. I wanted to implement some preference options to make the user create their own content. Firstly, they can choose what the maximum distance is they want to travel to the stations (default 500 meters). Secondly, can filter out all the stations that are currently unavailable (default all). Finally, they can sort the content by sustainability or distance (default sustainability).

Filters default        |  Filters adjusted     
:---------------------:|:---------------------:
![Filters default](https://github.com/dannyfrelink/sustainable-charging/blob/main/public/images/readme/concept-filters-1.png) | ![Filters adjusted](https://github.com/dannyfrelink/sustainable-charging/blob/main/public/images/readme/concept-filters-2.png)

With all the preference options complete, I wanted to delph into the data of the best times to charge. I calculated the times with the most green electricity and filtered out the four highest values. I opened this tab on load and added some motivational text to make the user more aware of the situation. Also, I wanted to introduce the users with my application. To do so, I added a landing page with some textual explanation of it. The user will have to click on the button to start searching for stations in their area.

Landing page        |  Best times    
:------------------:|:------------------:
![Landing page](https://github.com/dannyfrelink/sustainable-charging/blob/main/public/images/readme/concept-landing-page.png) | ![Best times](https://github.com/dannyfrelink/sustainable-charging/blob/main/public/images/readme/concept-best-times.png)



## API



## ⚙️ Process (Wiki)

You can find all the progression of my work documented in my [Wiki](https://github.com/dannyfrelink/sustainable-charging/wiki/Proces).

## 📝 Wishlist

I've been keeping my wishlist inside my [Issues](https://github.com/dannyfrelink/sustainable-charging/issues) tab of this repository. Everytime I finished working on one of the issues, I closed this issue to make sure to keep my wishlist clean. Sadly, I wasn't able to complete all the things on my wishlist, since it kept growing and growing during the weeks. Therefore, I had to make choices of what to do and what not to do. Everything still on the list was chosen to leave for now.

## 🔧 Installation

If you want to use my code for your own, you can clone the repository as a local file:

```
    git clone https://github.com/dannyfrelink/sustainable-charging
```

You then need to install all NPM packages:

```
    npm install
```

Now you're able to start working with my project. Simply run the following line in your terminal:

```
    npm run dev
```

## 📄 License

I have used the [MIT License](https://github.com/dannyfrelink/sustainable-charging/blob/main/LICENSE) for this repository.