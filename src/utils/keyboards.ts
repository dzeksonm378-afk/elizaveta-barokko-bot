import { Markup } from "telegraf";

import { Building, CategoryKind, CategorySelection } from "../types/building";
import { FoodPlace } from "../types/foodPlace";
import { Place } from "../types/place";
import { Post } from "../types/post";
import { QuizQuestion } from "../types/quizQuestion";

const QUIZ_OPTION_LETTERS = ["А", "Б", "В", "Г", "Д", "Е"];

const getQuizOptionLabel = (option: string, index: number): string => {
  const letter = QUIZ_OPTION_LETTERS[index] || String(index + 1);

  return `${letter}) ${option}`;
};

export type CategoryButtonOption = {
  id: number;
  label: string;
};

export type PlaceCategoryButtonOption = CategoryButtonOption & {
  buttonLabel: string;
};

export type FoodCategoryButtonOption = CategoryButtonOption & {
  buttonLabel: string;
};

export type PostCategoryButtonOption = CategoryButtonOption & {
  buttonLabel: string;
};

export const getMainMenuKeyboard = (
  channelUrl: string,
  guideDmUrl: string
) => {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🔎 Найти пост по теме", "menu:posts")],
    [Markup.button.callback("🎲 Викторина", "menu:quiz")],
    [Markup.button.url("📢 Вернуться в канал", channelUrl)],
    [Markup.button.url("🚶 Заказать экскурсию", guideDmUrl)],
    [Markup.button.callback("ℹ️ Помощь", "menu:help")]
  ]);
};

export const getCategoryKeyboard = (
  kind: CategoryKind,
  options: CategoryButtonOption[]
) => {
  const optionRows = options.map((option) => {
    return [Markup.button.callback(option.label, `select:${kind}:${option.id}`)];
  });

  return Markup.inlineKeyboard([
    ...optionRows,
    [Markup.button.callback("Назад в меню", "menu:back")]
  ]);
};

export const getBackToMenuKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback("Назад в меню", "menu:back")]
  ]);
};

export const getHomeKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🏠 Главное меню", "menu:back")]
  ]);
};

export const getPostCategoryKeyboard = (
  options: PostCategoryButtonOption[]
) => {
  const optionRows = options.map((option) => {
    return [
      Markup.button.callback(option.buttonLabel, `post:category:${option.id}`)
    ];
  });

  return Markup.inlineKeyboard([
    ...optionRows,
    [Markup.button.callback("🔙 Назад в меню", "menu:back")]
  ]);
};

export const getPostListKeyboard = (
  posts: Post[],
  categoryId: number,
  nextOffset: number | null
) => {
  const postRows = posts.map((post) => {
    return [Markup.button.url(post.title, post.url)];
  });

  const navigationRows = nextOffset === null
    ? []
    : [
        [
          Markup.button.callback(
            "➡️ Показать ещё",
            `post:page:${categoryId}:${nextOffset}`
          )
        ]
      ];

  return Markup.inlineKeyboard([
    ...postRows,
    ...navigationRows,
    [Markup.button.callback("🔙 Назад к рубрикам", "post:categories")],
    [Markup.button.callback("🏠 Главное меню", "menu:back")]
  ]);
};

export const getQuizAnswerKeyboard = (question: QuizQuestion) => {
  const answerRows = question.options.map((option, index) => {
    return [
      Markup.button.callback(
        getQuizOptionLabel(option, index),
        `quiz:answer:${question.id}:${index}`
      )
    ];
  });

  return Markup.inlineKeyboard([
    ...answerRows,
    [Markup.button.callback("🏠 Главное меню", "menu:back")]
  ]);
};

export const getQuizResultKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🎲 Ещё вопрос", "quiz:next")],
    [Markup.button.callback("🏠 Главное меню", "menu:back")]
  ]);
};

export const getPlaceCategoryKeyboard = (
  options: PlaceCategoryButtonOption[]
) => {
  const optionRows = options.map((option) => {
    return [
      Markup.button.callback(option.buttonLabel, `place:category:${option.id}`)
    ];
  });

  return Markup.inlineKeyboard([
    ...optionRows,
    [Markup.button.callback("🔙 Назад в меню", "menu:back")]
  ]);
};

export const getBuildingKeyboard = (
  building: Building,
  selection: CategorySelection | null
) => {
  const moreButton = selection
    ? Markup.button.callback(
        "Ещё объект",
        `more:${selection.kind}:${selection.optionId}:${building.id}`
      )
    : Markup.button.callback("Ещё объект", `random:next:${building.id}`);

  return Markup.inlineKeyboard([
    [Markup.button.url("Открыть пост", building.channelUrl)],
    [moreButton],
    [Markup.button.callback("Назад в меню", "menu:back")]
  ]);
};

export const getPlaceKeyboard = (place: Place, categoryId: number) => {
  return Markup.inlineKeyboard([
    [Markup.button.url("📖 Открыть пост", place.channelUrl)],
    [Markup.button.callback("🎲 Ещё место", `place:more:${categoryId}:${place.id}`)],
    [Markup.button.callback("🔙 Назад к категориям", "place:categories")],
    [Markup.button.callback("🏠 Главное меню", "menu:back")]
  ]);
};

export const getPlacePaginationKeyboard = (
  categoryId: number,
  nextOffset: number
) => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        "➡️ Показать ещё",
        `place:page:${categoryId}:${nextOffset}`
      )
    ],
    [Markup.button.callback("🔙 Назад к категориям", "place:categories")],
    [Markup.button.callback("🏠 Главное меню", "menu:back")]
  ]);
};

export const getFoodCategoryKeyboard = (
  options: FoodCategoryButtonOption[]
) => {
  const optionRows = options.map((option) => {
    return [
      Markup.button.callback(option.buttonLabel, `food:category:${option.id}`)
    ];
  });

  return Markup.inlineKeyboard([
    ...optionRows,
    [Markup.button.callback("🔙 Назад в меню", "menu:back")]
  ]);
};

export const getFoodPlaceKeyboard = (
  foodPlace: FoodPlace,
  categoryId: number
) => {
  return Markup.inlineKeyboard([
    [Markup.button.url("📖 Открыть пост", foodPlace.channelUrl)],
    [
      Markup.button.callback(
        "🎲 Ещё место",
        `food:more:${categoryId}:${foodPlace.id}`
      )
    ],
    [Markup.button.callback("🔙 Назад к категориям", "food:categories")],
    [Markup.button.callback("🏠 Главное меню", "menu:back")]
  ]);
};

export const getFoodPaginationKeyboard = (
  categoryId: number,
  nextOffset: number
) => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        "➡️ Показать ещё",
        `food:page:${categoryId}:${nextOffset}`
      )
    ],
    [Markup.button.callback("🔙 Назад к категориям", "food:categories")],
    [Markup.button.callback("🏠 Главное меню", "menu:back")]
  ]);
};
