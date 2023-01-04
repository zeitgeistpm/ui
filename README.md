# Zeitgeist prediction markets

## Install dependencies

`yarn install`

## Run development environment

`yarn dev`

## Environment variables

Some features require environment variables. To test locally create `.env.local` file from `.env.example`.

# Components

## Hero Slider

This lightweight slider is a custom solution created for the Zeitgeist UI homepage.

### Files

| File                  | Purpose                                                            |
| --------------------- | ------------------------------------------------------------------ |
| /hero-slider          | contains all relevant hero slider files                            |
| CustomSlides.tsx      | (optional) custom slides that require unique styling               |
| HeroControls.tsx      | left/right buttons and dot navigation                              |
| HeroSlider.tsx        | main file with container, slide, and control components            |
| HeroSlide.tsx         | main template file for default slides                              |
| slider-controls.tsx   | business logic for slider controls                                 |
| slider-types.tsx      | TypeScript interfaces for hero slider elements                     |
| slider-data.tsx       | an array of objects used to display slide content in HeroSlide.tsx |
| HeroSlider.module.css | css animation for slider transitions                               |

### Usage

To customize a slide's content simply update the slides-data.tsx file. Use _false_ as the value in the _custom_ key to use the default template or _true_ to enable to use of a custom slide from the CustomSlides.tsx file.

When using a custom slide match the _id_ from slider-data.tsx to the CustomSlide component in CustomSlides.tsx. For exmaple: id of 2 will activate CustomSlide2.

To add more template slides: expand on the array in slider-date.tsx. To add additional custom slides: create additional components in CustomSlide.tsx and import them into the getCustomSlide function in HeroSlide.tsx.

Autoplay can be turned off by commenting out the the useEffect hook in HeroSlider.tsx. Duration of autoplay can adjusted in the setTimeout function.

### Future Considerations

Refactor to allow more customized instances of the hero slider. For example; styles could be passed in as props to the components. Create a settings file where traits like transition style or speed could be adjusted in.
