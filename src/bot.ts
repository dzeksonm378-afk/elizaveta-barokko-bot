import path from "node:path";
import { Context, Telegraf } from "telegraf";

import buildingsData from "./data/buildings.json";
import foodPlacesData from "./data/foodPlaces.json";
import placesData from "./data/places.json";
import postsData from "./data/posts.json";
import quizQuestionsData from "./data/quizQuestions.json";
import { Building, CategoryKind, CategorySelection } from "./types/building";
import { FoodPlace } from "./types/foodPlace";
import { Place } from "./types/place";
import { Post } from "./types/post";
import { QuizQuestion } from "./types/quizQuestion";
import { formatBuilding } from "./utils/formatBuilding";
import { formatFoodPlace } from "./utils/formatFoodPlace";
import { formatPlace } from "./utils/formatPlace";
import {
  CategoryButtonOption,
  FoodCategoryButtonOption,
  getBackToMenuKeyboard,
  getBuildingKeyboard,
  getCategoryKeyboard,
  getFoodCategoryKeyboard,
  getFoodPaginationKeyboard,
  getFoodPlaceKeyboard,
  getHomeKeyboard,
  getMainMenuKeyboard,
  getPostCategoryKeyboard,
  getPostListKeyboard,
  getQuizAnswerKeyboard,
  getQuizResultKeyboard,
  getPlaceCategoryKeyboard,
  getPlacePaginationKeyboard,
  getPlaceKeyboard,
  PlaceCategoryButtonOption,
  PostCategoryButtonOption
} from "./utils/keyboards";

const BOT_WELCOME_MESSAGE =
  [
    "Привет! Я навигатор по Telegram-каналу «Елизаветинское барокко».",
    "",
    "Помогаю быстро найти нужную публикацию по теме, вернуться в канал или заказать экскурсию.",
    "",
    "Выберите действие в меню ниже."
  ].join("\n");
const HELP_MESSAGE = [
  "ℹ️ Помощь",
  "",
  "Я бот-навигатор канала «Елизаветинское барокко».",
  "",
  "Что можно сделать:",
  "🔎 выбрать рубрику и открыть нужный пост в канале",
  "🎲 перейти к викторине",
  "📢 вернуться в Telegram-канал",
  "🚶 заказать экскурсию",
  "",
  "Нажмите /start, чтобы открыть главное меню, или пользуйтесь кнопками под сообщениями."
].join("\n");
const CHANNEL_URL = process.env.CHANNEL_URL || "https://t.me/elizaveta_guide_spb";
const GUIDE_DM_URL = process.env.GUIDE_DM_URL || "https://t.me/lisademyanova";
const MAX_BUILDINGS_PER_SELECTION = 5;
const MAX_PLACES_PER_CATEGORY = 5;
const MAX_FOOD_PLACES_PER_CATEGORY = 5;
const MAX_POSTS_PER_PAGE = 8;

const buildings: Building[] = buildingsData as Building[];
const places: Place[] = placesData as Place[];
const foodPlaces: FoodPlace[] = foodPlacesData as FoodPlace[];
const posts: Post[] = postsData as Post[];
const quizQuestions: QuizQuestion[] = quizQuestionsData as QuizQuestion[];
const quizQueueByUser = new Map<number, number[]>();
const lastQuizQuestionByUser = new Map<number, number>();

const createCategoryOptions = (values: string[]): CategoryButtonOption[] => {
  return [...new Set(values)]
    .sort((left, right) => left.localeCompare(right, "ru"))
    .map((label, index) => ({ id: index, label }));
};

const categoryOptions: Record<CategoryKind, CategoryButtonOption[]> = {
  style: createCategoryOptions(buildings.map((building) => building.style)),
  district: createCategoryOptions(buildings.map((building) => building.district))
};

const postCategoryOptions: PostCategoryButtonOption[] = [
  { id: 0, label: "Истории о людях", buttonLabel: "👥 Истории о людях" },
  {
    id: 1,
    label: "Архитектура и скульптура",
    buttonLabel: "🏛️ Архитектура и скульптура"
  },
  { id: 2, label: "Петербургские львы", buttonLabel: "🦁 Петербургские львы" },
  { id: 3, label: "Фаберже", buttonLabel: "💎 Фаберже" },
  { id: 4, label: "Куда сходить?", buttonLabel: "📍 Куда сходить?" }
];

const placeCategoryOptions: PlaceCategoryButtonOption[] = [
  { id: 0, label: "Где пофоткаться", buttonLabel: "📸 Где пофоткаться" },
  { id: 1, label: "Где погулять", buttonLabel: "🚶 Где погулять" },
  {
    id: 2,
    label: "Первый раз в Петербурге",
    buttonLabel: "🔥 Первый раз в Петербурге"
  },
  {
    id: 3,
    label: "Креативные пространства",
    buttonLabel: "🎨 Креативные пространства"
  },
  { id: 4, label: "Набережные", buttonLabel: "🌊 Набережные" },
  { id: 5, label: "Вечерняя прогулка", buttonLabel: "🌙 Вечерняя прогулка" },
  { id: 6, label: "Небанальные места", buttonLabel: "💎 Небанальные места" },
  {
    id: 7,
    label: "Красиво для свидания",
    buttonLabel: "❤️ Красиво для свидания"
  },
  {
    id: 8,
    label: "Архитектурные точки",
    buttonLabel: "🏛️ Архитектурные точки"
  },
  { id: 9, label: "Парки и сады", buttonLabel: "🌳 Парки и сады" }
];

const foodCategoryOptions: FoodCategoryButtonOption[] = [
  { id: 0, label: "Кофе и десерты", buttonLabel: "☕ Кофе и десерты" },
  { id: 1, label: "Завтраки", buttonLabel: "🥐 Завтраки" },
  {
    id: 2,
    label: "Вкусно и недорого",
    buttonLabel: "🍽️ Вкусно и недорого"
  },
  { id: 3, label: "Рядом с прогулкой", buttonLabel: "🚶 Рядом с прогулкой" },
  { id: 4, label: "Вечером посидеть", buttonLabel: "🌙 Вечером посидеть" },
  { id: 5, label: "Быстрый перекус", buttonLabel: "🥡 Быстрый перекус" }
];

const shuffle = <T>(items: T[]): T[] => {
  const copied = [...items];

  for (let index = copied.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copied[index], copied[randomIndex]] = [copied[randomIndex], copied[index]];
  }

  return copied;
};

const getSelection = (
  kind: CategoryKind,
  optionId: number
): CategorySelection | null => {
  const option = categoryOptions[kind].find((item) => item.id === optionId);

  if (!option) {
    return null;
  }

  return {
    kind,
    optionId,
    value: option.label
  };
};

const getBuildingsBySelection = (selection: CategorySelection): Building[] => {
  return buildings.filter((building) => {
    if (selection.kind === "style") {
      return building.style === selection.value;
    }

    return building.district === selection.value;
  });
};

const getSelectionLabel = (selection: CategorySelection): string => {
  return selection.kind === "style"
    ? `в стиле "${selection.value}"`
    : `в районе "${selection.value}"`;
};

const getPostCategory = (
  categoryId: number
): PostCategoryButtonOption | null => {
  return (
    postCategoryOptions.find((category) => category.id === categoryId) || null
  );
};

const getPostsByCategory = (category: PostCategoryButtonOption): Post[] => {
  return posts.filter((post) => post.category === category.label);
};

const getQuizQuestionById = (questionId: number): QuizQuestion | null => {
  return quizQuestions.find((question) => question.id === questionId) || null;
};

const createQuizQueue = (lastQuestionId?: number): number[] => {
  const queue = shuffle(quizQuestions.map((question) => question.id));

  if (
    queue.length > 1 &&
    lastQuestionId !== undefined &&
    queue[0] === lastQuestionId
  ) {
    const replacementIndex = queue.findIndex((questionId) => {
      return questionId !== lastQuestionId;
    });

    if (replacementIndex > 0) {
      [queue[0], queue[replacementIndex]] = [queue[replacementIndex], queue[0]];
    }
  }

  return queue;
};

const takeQuestionFromQueue = (queue: number[]): QuizQuestion | null => {
  while (queue.length > 0) {
    const questionId = queue.shift();

    if (questionId === undefined) {
      continue;
    }

    const question = getQuizQuestionById(questionId);

    if (question) {
      return question;
    }
  }

  return null;
};

const getFallbackQuizQuestion = (): QuizQuestion | null => {
  const queue = createQuizQueue();

  return takeQuestionFromQueue(queue);
};

const getNextQuizQuestionForUser = (
  userId: number
): { question: QuizQuestion | null; isNewRound: boolean } => {
  if (quizQuestions.length === 0) {
    return { question: null, isNewRound: false };
  }

  let queue = quizQueueByUser.get(userId);
  let isNewRound = false;

  if (!queue || queue.length === 0) {
    isNewRound = queue !== undefined;
    queue = createQuizQueue(lastQuizQuestionByUser.get(userId));
    quizQueueByUser.set(userId, queue);
  }

  let question = takeQuestionFromQueue(queue);

  if (!question) {
    isNewRound = true;
    queue = createQuizQueue(lastQuizQuestionByUser.get(userId));
    quizQueueByUser.set(userId, queue);
    question = takeQuestionFromQueue(queue);
  }

  if (question) {
    lastQuizQuestionByUser.set(userId, question.id);
  }

  return { question, isNewRound };
};

const QUIZ_OPTION_LETTERS = ["А", "Б", "В", "Г", "Д", "Е"];

const getQuizAnswerLabel = (index: number, option: string): string => {
  const letter = QUIZ_OPTION_LETTERS[index] || String(index + 1);

  return `${letter}) ${option}`;
};

const getQuizQuestionText = (question: QuizQuestion): string => {
  return [
    "🎲 Викторина",
    "",
    `🖼️ ${question.question}`,
    "",
    "Выбери вариант ответа:"
  ].join("\n");
};

const getQuizImageSource = (imagePath: string): string => {
  return path.isAbsolute(imagePath)
    ? imagePath
    : path.join(process.cwd(), imagePath);
};

const getRandomBuilding = (
  items: Building[],
  excludedId?: number
): Building | null => {
  if (items.length === 0) {
    return null;
  }

  const candidates =
    excludedId === undefined
      ? items
      : items.filter((building) => building.id !== excludedId);

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
};

const getPlaceCategory = (categoryId: number): PlaceCategoryButtonOption | null => {
  return placeCategoryOptions.find((category) => category.id === categoryId) || null;
};

const getPlacesByCategory = (category: PlaceCategoryButtonOption): Place[] => {
  return places.filter((place) => place.category === category.label);
};

const getRandomPlace = (
  items: Place[],
  excludedId?: number
): Place | null => {
  if (items.length === 0) {
    return null;
  }

  const candidates =
    excludedId === undefined
      ? items
      : items.filter((place) => place.id !== excludedId);

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
};

const getFoodCategory = (
  categoryId: number
): FoodCategoryButtonOption | null => {
  return (
    foodCategoryOptions.find((category) => category.id === categoryId) || null
  );
};

const getFoodPlacesByCategory = (
  category: FoodCategoryButtonOption
): FoodPlace[] => {
  return foodPlaces.filter((foodPlace) => foodPlace.category === category.label);
};

const getRandomFoodPlace = (
  items: FoodPlace[],
  excludedId?: number
): FoodPlace | null => {
  if (items.length === 0) {
    return null;
  }

  const candidates =
    excludedId === undefined
      ? items
      : items.filter((foodPlace) => foodPlace.id !== excludedId);

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
};

const sendMainMenu = async (ctx: Context) => {
  await ctx.reply(BOT_WELCOME_MESSAGE, {
    ...getMainMenuKeyboard(CHANNEL_URL, GUIDE_DM_URL)
  });
};

const sendBuildingCard = async (
  ctx: Context,
  building: Building,
  selection: CategorySelection | null
) => {
  const text = formatBuilding(building);
  const keyboard = getBuildingKeyboard(building, selection);

  // Если Telegram не смог загрузить фото по ссылке, бот отправит ту же карточку как текст.
  if (building.imageUrl) {
    try {
      await ctx.replyWithPhoto(building.imageUrl, {
        caption: text,
        ...keyboard
      });
      return;
    } catch (error) {
      console.error(`Не удалось отправить фото для объекта ${building.id}:`, error);
    }
  }

  await ctx.reply(text, {
    ...keyboard
  });
};

const sendPostCategories = async (ctx: Context) => {
  await ctx.reply("Выбери рубрику:", {
    ...getPostCategoryKeyboard(postCategoryOptions)
  });
};

const sendPostsByCategory = async (
  ctx: Context,
  category: PostCategoryButtonOption,
  offset = 0
) => {
  const matchedPosts = getPostsByCategory(category);

  if (matchedPosts.length === 0) {
    await ctx.reply("Пока в этой рубрике нет постов.", {
      ...getPostCategoryKeyboard(postCategoryOptions)
    });
    return;
  }

  const selectedPosts = matchedPosts.slice(offset, offset + MAX_POSTS_PER_PAGE);

  if (selectedPosts.length === 0) {
    await ctx.reply("Это все посты в рубрике.", {
      ...getPostCategoryKeyboard(postCategoryOptions)
    });
    return;
  }

  const nextOffset = offset + MAX_POSTS_PER_PAGE;

  await ctx.reply(`Выбери пост из рубрики «${category.label}»:`, {
    ...getPostListKeyboard(
      selectedPosts,
      category.id,
      nextOffset < matchedPosts.length ? nextOffset : null
    )
  });
};

const sendQuizQuestion = async (ctx: Context) => {
  const userId = ctx.from?.id;
  const quizResult =
    userId === undefined
      ? { question: getFallbackQuizQuestion(), isNewRound: false }
      : getNextQuizQuestionForUser(userId);
  const { question, isNewRound } = quizResult;

  if (!question) {
    await ctx.reply("Пока нет вопросов для викторины.", {
      ...getHomeKeyboard()
    });
    return;
  }

  if (isNewRound) {
    await ctx.reply("Ты уже ответил(а) на все вопросы — начинаем новый круг 🎲");
  }

  console.log("Quiz question for user", userId, "questionId:", question.id);

  const text = getQuizQuestionText(question);
  const keyboard = getQuizAnswerKeyboard(question);

  if (question.imagePath) {
    try {
      await ctx.replyWithPhoto(
        { source: getQuizImageSource(question.imagePath) },
        {
          caption: text,
          ...keyboard
        }
      );
      return;
    } catch (error) {
      console.error(
        `Не удалось отправить фото для вопроса ${question.id}:`,
        error
      );
    }
  }

  await ctx.reply(text, {
    ...keyboard
  });
};

const sendPlaceCategories = async (ctx: Context) => {
  await ctx.reply("Выбери подборку мест Петербурга:", {
    ...getPlaceCategoryKeyboard(placeCategoryOptions)
  });
};

const sendPlaceCard = async (
  ctx: Context,
  place: Place,
  categoryId: number
) => {
  const text = formatPlace(place);
  const keyboard = getPlaceKeyboard(place, categoryId);

  if (place.imageUrl) {
    try {
      await ctx.replyWithPhoto(place.imageUrl, {
        caption: text,
        ...keyboard
      });
      return;
    } catch (error) {
      console.error(`Не удалось отправить фото для места ${place.id}:`, error);
    }
  }

  await ctx.reply(text, {
    ...keyboard
  });
};

const sendPlacesByCategory = async (
  ctx: Context,
  category: PlaceCategoryButtonOption,
  offset = 0
) => {
  const matchedPlaces = getPlacesByCategory(category);

  if (matchedPlaces.length === 0) {
    await ctx.reply(
      "Пока в этой подборке нет мест, но мы скоро добавим новые локации.",
      {
        ...getHomeKeyboard()
      }
    );
    return;
  }

  const selectedPlaces = matchedPlaces.slice(
    offset,
    offset + MAX_PLACES_PER_CATEGORY
  );

  if (selectedPlaces.length === 0) {
    await ctx.reply("Это все места в подборке.", {
      ...getPlaceCategoryKeyboard(placeCategoryOptions)
    });
    return;
  }

  for (const place of selectedPlaces) {
    await sendPlaceCard(ctx, place, category.id);
  }

  const nextOffset = offset + MAX_PLACES_PER_CATEGORY;

  if (nextOffset < matchedPlaces.length) {
    await ctx.reply("В этой подборке есть ещё места.", {
      ...getPlacePaginationKeyboard(category.id, nextOffset)
    });
    return;
  }

  if (offset > 0) {
    await ctx.reply("Это все места в подборке.", {
      ...getPlaceCategoryKeyboard(placeCategoryOptions)
    });
  }
};

const sendFoodCategories = async (ctx: Context) => {
  await ctx.reply("Выбери подборку, где поесть в Петербурге:", {
    ...getFoodCategoryKeyboard(foodCategoryOptions)
  });
};

const sendFoodPlaceCard = async (
  ctx: Context,
  foodPlace: FoodPlace,
  categoryId: number
) => {
  const text = formatFoodPlace(foodPlace);
  const keyboard = getFoodPlaceKeyboard(foodPlace, categoryId);

  if (foodPlace.imageUrl) {
    try {
      await ctx.replyWithPhoto(foodPlace.imageUrl, {
        caption: text,
        ...keyboard
      });
      return;
    } catch (error) {
      console.error(
        `Не удалось отправить фото для заведения ${foodPlace.id}:`,
        error
      );
    }
  }

  await ctx.reply(text, {
    ...keyboard
  });
};

const sendFoodPlacesByCategory = async (
  ctx: Context,
  category: FoodCategoryButtonOption,
  offset = 0
) => {
  const matchedFoodPlaces = getFoodPlacesByCategory(category);

  if (matchedFoodPlaces.length === 0) {
    await ctx.reply(
      "Пока в этой подборке нет заведений, но мы скоро добавим новые места.",
      {
        ...getHomeKeyboard()
      }
    );
    return;
  }

  const selectedFoodPlaces = matchedFoodPlaces.slice(
    offset,
    offset + MAX_FOOD_PLACES_PER_CATEGORY
  );

  if (selectedFoodPlaces.length === 0) {
    await ctx.reply("Это все места в подборке.", {
      ...getFoodCategoryKeyboard(foodCategoryOptions)
    });
    return;
  }

  for (const foodPlace of selectedFoodPlaces) {
    await sendFoodPlaceCard(ctx, foodPlace, category.id);
  }

  const nextOffset = offset + MAX_FOOD_PLACES_PER_CATEGORY;

  if (nextOffset < matchedFoodPlaces.length) {
    await ctx.reply("В этой подборке есть ещё места.", {
      ...getFoodPaginationKeyboard(category.id, nextOffset)
    });
    return;
  }

  if (offset > 0) {
    await ctx.reply("Это все места в подборке.", {
      ...getFoodCategoryKeyboard(foodCategoryOptions)
    });
  }
};

const sendSelectionResults = async (
  ctx: Context,
  selection: CategorySelection
) => {
  const matchedBuildings = getBuildingsBySelection(selection);

  if (matchedBuildings.length === 0) {
    await ctx.reply(
      "Пока в базе нет объектов по этому запросу, но позже мы добавим больше мест.",
      {
        ...getBackToMenuKeyboard()
      }
    );
    return;
  }

  const sampledBuildings = shuffle(matchedBuildings).slice(
    0,
    MAX_BUILDINGS_PER_SELECTION
  );

  await ctx.reply(
    `Нашёл ${sampledBuildings.length} объект(а) ${getSelectionLabel(selection)}.`
  );

  for (const building of sampledBuildings) {
    await sendBuildingCard(ctx, building, selection);
  }
};

const registerBotHandlers = (bot: Telegraf<Context>) => {
bot.start(async (ctx) => {
  await sendMainMenu(ctx);
});

bot.help(async (ctx) => {
  await ctx.reply(HELP_MESSAGE, {
    ...getMainMenuKeyboard(CHANNEL_URL, GUIDE_DM_URL)
  });
});

bot.action("menu:posts", async (ctx) => {
  await ctx.answerCbQuery();
  await sendPostCategories(ctx);
});

bot.action("menu:quiz", async (ctx) => {
  await ctx.answerCbQuery();
  await sendQuizQuestion(ctx);
});

bot.action("quiz:next", async (ctx) => {
  await ctx.answerCbQuery();
  await sendQuizQuestion(ctx);
});

bot.action(/^quiz:answer:(\d+):(\d+)$/, async (ctx) => {
  const [, questionIdText, selectedOptionIndexText] =
    ctx.match as RegExpExecArray;
  const question = getQuizQuestionById(Number(questionIdText));
  const selectedOptionIndex = Number(selectedOptionIndexText);

  if (!question) {
    await ctx.answerCbQuery();
    await ctx.reply("Не удалось найти вопрос. Попробуйте открыть викторину заново.", {
      ...getHomeKeyboard()
    });
    return;
  }

  const isCorrect = selectedOptionIndex === question.correctOptionIndex;
  const correctAnswer =
    question.options[question.correctOptionIndex] || "Ответ не найден";
  const correctAnswerLabel = getQuizAnswerLabel(
    question.correctOptionIndex,
    correctAnswer
  );

  await ctx.answerCbQuery(isCorrect ? "Правильно!" : "Неверно");
  await ctx.reply(
    [
      isCorrect ? "✅ Правильно!" : "❌ Неправильно.",
      "",
      `Правильный ответ: ${correctAnswerLabel}`,
      "",
      question.explanation
    ].join("\n"),
    {
      ...getQuizResultKeyboard()
    }
  );
});

bot.action("menu:styles", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("Выбери архитектурный стиль, который тебе интересен:", {
    ...getCategoryKeyboard("style", categoryOptions.style)
  });
});

bot.action("menu:districts", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("Выбери район Петербурга:", {
    ...getCategoryKeyboard("district", categoryOptions.district)
  });
});

bot.action("menu:help", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(HELP_MESSAGE, {
    ...getMainMenuKeyboard(CHANNEL_URL, GUIDE_DM_URL)
  });
});

bot.action("menu:random", async (ctx) => {
  await ctx.answerCbQuery();

  const building = getRandomBuilding(buildings);

  if (!building) {
    await ctx.reply("Список зданий пока пуст.");
    return;
  }

  await sendBuildingCard(ctx, building, null);
});

bot.action("menu:places", async (ctx) => {
  await ctx.answerCbQuery();
  await sendPlaceCategories(ctx);
});

bot.action("menu:food", async (ctx) => {
  await ctx.answerCbQuery();
  await sendFoodCategories(ctx);
});

bot.action("menu:back", async (ctx) => {
  await ctx.answerCbQuery();
  await sendMainMenu(ctx);
});

bot.action("post:categories", async (ctx) => {
  await ctx.answerCbQuery();
  await sendPostCategories(ctx);
});

bot.action(/^post:category:(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();

  const [, categoryIdText] = ctx.match as RegExpExecArray;
  const category = getPostCategory(Number(categoryIdText));

  if (!category) {
    await ctx.reply("Не удалось найти такую рубрику. Откройте раздел заново.", {
      ...getHomeKeyboard()
    });
    return;
  }

  await sendPostsByCategory(ctx, category);
});

bot.action(/^post:page:(\d+):(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();

  const [, categoryIdText, offsetText] = ctx.match as RegExpExecArray;
  const category = getPostCategory(Number(categoryIdText));

  if (!category) {
    await ctx.reply("Не удалось продолжить список. Откройте раздел заново.", {
      ...getHomeKeyboard()
    });
    return;
  }

  await sendPostsByCategory(ctx, category, Number(offsetText));
});

bot.action("place:categories", async (ctx) => {
  await ctx.answerCbQuery();
  await sendPlaceCategories(ctx);
});

bot.action(/^place:category:(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();

  const [, categoryIdText] = ctx.match as RegExpExecArray;
  const category = getPlaceCategory(Number(categoryIdText));

  if (!category) {
    await ctx.reply("Не удалось найти такую подборку. Откройте раздел заново.", {
      ...getHomeKeyboard()
    });
    return;
  }

  await sendPlacesByCategory(ctx, category);
});

bot.action(/^place:page:(\d+):(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();

  const [, categoryIdText, offsetText] = ctx.match as RegExpExecArray;
  const category = getPlaceCategory(Number(categoryIdText));

  if (!category) {
    await ctx.reply("Не удалось продолжить подборку. Откройте раздел заново.", {
      ...getHomeKeyboard()
    });
    return;
  }

  await sendPlacesByCategory(ctx, category, Number(offsetText));
});

bot.action(/^place:more:(\d+):(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();

  const [, categoryIdText, currentPlaceIdText] = ctx.match as RegExpExecArray;
  const category = getPlaceCategory(Number(categoryIdText));

  if (!category) {
    await ctx.reply("Не удалось продолжить подборку. Откройте раздел заново.", {
      ...getHomeKeyboard()
    });
    return;
  }

  const nextPlace = getRandomPlace(
    getPlacesByCategory(category),
    Number(currentPlaceIdText)
  );

  if (!nextPlace) {
    await ctx.reply("Других мест в этой подборке пока нет.", {
      ...getPlaceCategoryKeyboard(placeCategoryOptions)
    });
    return;
  }

  await sendPlaceCard(ctx, nextPlace, category.id);
});

bot.action("food:categories", async (ctx) => {
  await ctx.answerCbQuery();
  await sendFoodCategories(ctx);
});

bot.action(/^food:category:(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();

  const [, categoryIdText] = ctx.match as RegExpExecArray;
  const category = getFoodCategory(Number(categoryIdText));

  if (!category) {
    await ctx.reply("Не удалось найти такую подборку. Откройте раздел заново.", {
      ...getHomeKeyboard()
    });
    return;
  }

  await sendFoodPlacesByCategory(ctx, category);
});

bot.action(/^food:page:(\d+):(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();

  const [, categoryIdText, offsetText] = ctx.match as RegExpExecArray;
  const category = getFoodCategory(Number(categoryIdText));

  if (!category) {
    await ctx.reply("Не удалось продолжить подборку. Откройте раздел заново.", {
      ...getHomeKeyboard()
    });
    return;
  }

  await sendFoodPlacesByCategory(ctx, category, Number(offsetText));
});

bot.action(/^food:more:(\d+):(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();

  const [, categoryIdText, currentFoodPlaceIdText] =
    ctx.match as RegExpExecArray;
  const category = getFoodCategory(Number(categoryIdText));

  if (!category) {
    await ctx.reply("Не удалось продолжить подборку. Откройте раздел заново.", {
      ...getHomeKeyboard()
    });
    return;
  }

  const nextFoodPlace = getRandomFoodPlace(
    getFoodPlacesByCategory(category),
    Number(currentFoodPlaceIdText)
  );

  if (!nextFoodPlace) {
    await ctx.reply("Других заведений в этой подборке пока нет.", {
      ...getFoodCategoryKeyboard(foodCategoryOptions)
    });
    return;
  }

  await sendFoodPlaceCard(ctx, nextFoodPlace, category.id);
});

bot.action(/^select:(style|district):(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();

  const [, kind, optionIdText] = ctx.match as RegExpExecArray;
  const selection = getSelection(kind as CategoryKind, Number(optionIdText));

  if (!selection) {
    await ctx.reply("Не удалось распознать фильтр. Попробуйте выбрать вариант ещё раз.");
    return;
  }

  await sendSelectionResults(ctx, selection);
});

bot.action(/^more:(style|district):(\d+):(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();

  const [, kind, optionIdText, currentBuildingIdText] =
    ctx.match as RegExpExecArray;
  const selection = getSelection(kind as CategoryKind, Number(optionIdText));

  if (!selection) {
    await ctx.reply("Не удалось продолжить подборку. Выберите фильтр заново.");
    return;
  }

  const nextBuilding = getRandomBuilding(
    getBuildingsBySelection(selection),
    Number(currentBuildingIdText)
  );

  if (!nextBuilding) {
    await ctx.reply("Других объектов в этой категории пока нет.");
    return;
  }

  await sendBuildingCard(ctx, nextBuilding, selection);
});

bot.action(/^random:next:(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();

  const [, currentBuildingIdText] = ctx.match as RegExpExecArray;
  const nextBuilding = getRandomBuilding(buildings, Number(currentBuildingIdText));

  if (!nextBuilding) {
    await ctx.reply("Других объектов пока нет.");
    return;
  }

  await sendBuildingCard(ctx, nextBuilding, null);
});

bot.on("text", async (ctx) => {
  if (ctx.message.text.startsWith("/")) {
    return;
  }

  await ctx.reply("Используйте команду /start или кнопки меню ниже.", {
    ...getMainMenuKeyboard(CHANNEL_URL, GUIDE_DM_URL)
  });
});

bot.on("callback_query", async (ctx) => {
  await ctx.answerCbQuery("Эта кнопка больше неактуальна. Откройте меню заново.");
});

bot.catch(async (error, ctx) => {
  console.error("Ошибка во время обработки обновления:", error);

  try {
    await ctx.reply("Что-то пошло не так. Попробуйте ещё раз.", {
      ...getMainMenuKeyboard(CHANNEL_URL, GUIDE_DM_URL)
    });
  } catch (replyError) {
    console.error("Не удалось отправить сообщение об ошибке:", replyError);
  }
});
};

export function createBot() {
  const token = process.env.BOT_TOKEN;

  if (!token) {
    throw new Error("BOT_TOKEN is required");
  }

  const bot = new Telegraf(token);

  registerBotHandlers(bot);

  return bot;
}
