/* 简体中文翻译。结构必须与 en.js 完全一致：相同的键名、相同的函数参数
 * 个数、相同的数组长度。改动这里的任何内容都必须在每个语言文件里同步——
 * 这个结构就是 src/i18n/index.js 所依赖的约定。
 *
 * 中文没有单复数变化，因此原文里按 n===1 分支的函数在这里两个分支
 * 常常写成同样的措辞，只是数字不同——保留函数本身的参数个数是关键，
 * 内部是否真的分支不影响运行。
 */
export default {
  tabs: {
    home: "首页",
    journal: "日记",
    symbols: "符号",
    profile: "我的",
    sleep: "睡眠",
    newDream: "记录新的梦",
  },

  splash: {
    loading: "Dream Rushes 正在加载",
  },

  home: {
    greeting: {
      night: "还没睡",
      morning: "早上好",
      afternoon: "下午好",
      evening: "晚上好",
    },
    title: "你梦到了什么？",
    lede: "趁记忆还热乎的时候说出来——半梦半醒时效果最好。",
    cta: "开始记录",
    streak: (n) => `连续 ${n} 天`,
    lastHeading: "昨夜",
    menagerieHeading: "你的异兽园",
    menagerieEmpty: "还没有生物。你写下的每一个梦都会留下一只。",
    untitled: "无题之梦",
  },

  journal: {
    viewList: "以列表显示",
    viewDeck: "以卡片显示",
    library: "你的角色库",
    libraryLede: "你的梦可以调用的人物、宠物和地点。",
    libraryCount: (n) =>
      n === 0 ? "还没有——添加你的梦要用到的面孔"
              : `${n} 项 · 人物、宠物、地点`,
    title: "日记",
    count: (n) => `${n} 个梦`,
    search: "搜索你的梦…",
    searchLabel: "搜索你的梦",
    empty: "还没有记录任何梦。",
    emptySearch: "没有找到。",
    untitled: "无题之梦",
    close: "关闭",
    referencesUsed: "使用的参考照片：",
    delete: "删除条目",
    deleted: "条目已删除",
    menu: "更多操作",
    edit: "编辑文字",
    editing: "编辑中",
    save: "保存",
    cancelEdit: "放弃更改",
    edited: "更改已保存",
    correct: "纠正拼写和语法",
    rewrite: "重新润色",
    elaborate: "完善叙事",
    working: "正在处理…",
    refineTitle: "这是重新润色后的版本",
    refineLede: "在你确认之前，你现在的文字会一直保留。",
    before: "现在",
    after: "润色后",
    keep: "保留我的版本",
    accept: "使用这个版本",
    share: "分享",
    sharing: "正在准备…",
    shared: "已分享",
    shareUnsupported: "此处不支持分享——文件已改为下载。",
    shareNothing: "还没有可分享的内容——这个梦还没有图片。",
    noCredits: "点数不足。充值即将开放。",
    original: "最初写下的内容",
    showOriginal: "显示我最初写的内容",
    hideOriginal: "隐藏原文",
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    actRemix: "重新混合",
    actRewrite: "重写",
    actEdit: "编辑",
    actShare: "分享",
    remixLede: "这些是你的图片所依据的文字。改一改，" +
               "下一组图片就会按新版本生成。",
    remixLabel: "你的图片所依据的梦境文字",
    remixGo: "生成新图片",
    filmRendering: "你的影片还在渲染中——完成后会出现在这里。",
    filmArrived: "✦ 你的影片已完成",
    makeLede: "还没有图片。要生成一些吗？",
    makeImages: "生成图片",
    makeFilmLede: "现在让它动起来。",
    makeFilm: "制作短片",
    calendar: "梦境日历",
    calLabel: "有记录的梦的日期——点击打开",
    calPrev: "上个月",
    calNext: "下个月",
    calMonths: ["1月", "2月", "3月", "4月", "5月", "6月",
                "7月", "8月", "9月", "10月", "11月", "12月"],
    calWeekdays: ["一", "二", "三", "四", "五", "六", "日"],
    calDreamt: (day, n) =>
      n === 1 ? `${day} 日：打开这个梦` : `${day} 日：${n} 个梦`,
    calSeveral: (n) => `那一晚有 ${n} 个梦`,
  },

  symbols: {
    title: "符号",
    subtitle: "反复出现的主题",
    empty: "还没有符号。多写几个梦，它们就会出现在这里。",
    close: "关闭",
    disclaimer: "一种常见的解读，供参考——并非诊断。",
    occurrences: (n) => `出现在 ${n} 个梦中`,
    untitled: "无题之梦",
  },

  profile: {
    title: "我的",
    credits: "点数",
    creditsSoon: "充值即将开放",
    you: "你",
    meSet: "点击更换你的照片",
    meEmpty: "添加一张照片，让梦里也能有你",
    addPhoto: "添加你的照片",
    changePhoto: "更换你的照片",
    statDreams: "个梦",
    statStreak: "天连续记录",
    people: "人物",
    pets: "宠物",
    places: "地点",
    new: "新建",
    deleteLabel: (tag) => `删除 @${tag}`,
    editLabel: (tag) => `编辑 @${tag}`,
    referenceFor: (tag) => `@${tag} 的参考照片`,
    removed: (tag) => `@${tag} 已移除`,
  },

  avatarDialog: {
    titleFor: { person: "添加人物", pet: "添加宠物", place: "添加地点" },
    editTitleFor: { person: "编辑人物", pet: "编辑宠物", place: "编辑地点" },
    meTitle: "这是你",
    nameLabel: (tag) => `名字（将成为 @${tag}）`,
    photoLabel: "参考照片",
    photoAdd: "添加照片",
    photoReplace: "更换照片",
    photoRemove: "移除照片",
    descLabel: "描述一下",
    descLabelOptional: "描述一下（可选）",
    descPlaceholder: "个子高，深色卷发，总穿着绿色外套",
    previewAlt: "所选照片的预览",
    privacy: "生成梦境图片时，这张照片会发送给 fal.ai。",
    cancel: "取消",
    save: "保存",
    saveChanges: "保存更改",
    needName: "⚠ 名字请只使用字母或数字。",
    needPhotoOrDesc: "⚠ 添加一张照片或一段描述——渲染时需要其中之一。",
    needPhotoOrDescHint: "添加一张照片或一段描述。两者都没有的话，就没有依据可画。",
    exists: (tag) => `⚠ @${tag} 已经存在。`,
    created: (tag) => `已添加 @${tag}`,
    saved: (tag) => `@${tag} 已更新`,
    readFailed: "⚠ 无法读取这张照片。",
  },

  tagCard: {
    label: (tag) => `关于 @${tag}`,
    categories: { person: "人物", pet: "宠物", place: "地点" },
    photoOnly: "没有描述——仅使用这张照片。",
    close: "关闭",
  },

  guide: [
    {
      title: "现实检验",
      text: "每天多问自己几次：我是不是在做梦？——然后真的去验证：" +
            "数数手指，看一眼钟表，移开视线，再看回去。" +
            "在梦里，答案会变化。",
    },
    {
      title: "记忆诱导清醒梦法（MILD）",
      text: "入睡时反复默念：「今晚我会意识到自己在做梦。」" +
            "回想一个做过的梦，想象自己在梦中察觉到这一点。",
    },
    {
      title: "醒后回眠法（WBTB）",
      text: "大约五小时后短暂醒来，保持清醒 20 到 30 分钟，再用 MILD 法" +
            "重新入睡。最可靠的方法——也是最费睡眠的方法。",
    },
    {
      title: "写下来",
      text: "醒来后立刻记下你的梦，起床前就写。经常记录的人" +
            "记得更多——并逐渐看出自己梦境里的规律。",
    },
  ],

  dream: {
    title: "记录你的梦",
    cancel: "取消",
    label: "昨晚我梦到…",
    placeholder: "……我向后跌落，穿过一座变成了水的城市，" +
                 "路灯变成了水母……",
    textLabel: "梦境文字",
    modeLegend: "想要什么样的呈现方式？",
    modeImages: "图片故事",
    modeImagesHint: "一组按顺序排列的静态画面",
    modeFilm: "影片",
    modeFilmHint: "一段简短的动态影像",
    privacy: "你的梦境文字会发送给 fal.ai（以及 DeepSeek，用于协助撰写提示词）。" +
             "参考照片和语音录音只发送给 fal.ai。你的日记始终保存在本设备上。",
    submit: "✦ 唤起这个梦",
    submitting: "正在唤起…",
    tooShort: "⚠ 请先多写一点。",
    caught: (name) => `✦ ${name} 加入了你的异兽园`,
    interview: "说出来",
    interviewHint: "我来问，你来说——想的话可以闭上眼睛",
    reading: "正在读取你的梦…",
    readingHint: "正在为它命名，并找出当时都有谁在场。",
    or: "或者写下来",
    loading: [
      "正在冲洗你的胶片…",
      "正在剪辑迷雾…",
      "正在为你的潜意识调色…",
      "正在唤起你所见的一切…",
      "几乎清醒了…",
    ],
  },

  wizard: {
    back: "返回",
    cancel: "取消",
    next: "继续",
    free: "免费",
    from: "起",
    credit: "点数",
    credits: "点数",
    tooShort: "⚠ 请先多写一点。",
    noCredits: "点数不足。充值即将开放。",
    progress: (n, total) => `第 ${n} 步，共 ${total} 步`,

    step1: {
      title: "你梦到了什么？",
      improve: "用 AI 润色",
      reading: "正在读取你的梦…",
      why: "AI 会用你自己的语言重新讲述这个梦，并找出其中出现的" +
           "人物和地点。之后的一切——人物、地点、图片——都建立在这个基础上。",
      previewTitle: "整理好了，请看",
      previewLede: "无论你选哪一个，你自己写的原文都会被保留。",
      yours: "你写的原文",
      improved: "润色版",
      keepMine: "保留我的文字",
      useImproved: "使用这个版本",
    },

    step2: {
      title: "接下来要做什么？",
      saveOnly: "只保存",
      saveOnlyHint: "存入日记，不生成任何内容",
      images: "图片故事",
      imagesHint: "按顺序排列的梦境静态画面",
      film: "影片",
      filmHint: "先渲染一张静态画面，再让它动起来",
      saved: "梦已保存",
    },

    step3: {
      title: "都有谁出现？",
      lede: "你角色库里已有的人会被自动识别。其余的，" +
            "告诉我们他们是谁——或者交给 AI 去想象。",
      empty: "这个梦里没有找到任何人物，没关系——继续吧。",
    },

    step4: {
      title: "发生在哪里？",
      lede: "一个从一个地方转到另一个地方的梦，两处地点都需要。" +
            "选项和之前一样。",
      empty: "这个梦里没有找到地点。AI 会想象一个出来。",
    },

    cast: {
      choose: "从角色库中选择",
      change: "更换",
      createNew: "新建",
      letAi: "交给 AI 决定",
      freeSet: "由 AI 创作",
      undecided: "还未决定",
      note: "任何未决定的部分都会由 AI 创作。",
      removeLabel: (name) => `移除 ${name}`,
      pickTitle: (name) => `「${name}」是谁？`,
      libraryEmpty: "你的角色库还是空的。",
    },

    step5: {
      title: "想要什么样的画面？",
      countLabel: "图片数量",
      countNames: { 3: "开头、中段、结尾", 5: "完整的故事弧线", 10: "每一个转折" },
      styleLabel: "风格",
      formatLabel: "画幅",
      portrait: "手机、竖屏动态",
      landscape: "宽屏",
      keyframeLabel: "哪张图片要动起来？",
      keyframeHint: "影片从这张图片开始——它的观感会贯穿整段影片。",
      filmModelLabel: "选择渲染引擎",
      filmModels: {
        standard: { name: "标准版", hint: "最长 15 秒 · 每秒 1 点数" },
        premium:  { name: "高级版", hint: "最长 30 秒一镜到底 · 每秒 6 点数" },
      },
      lengthLabel: "时长",
      posterLabel: "海报",
      posterTitleLabel: "影片标题",
      posterTitlePlaceholder: "海报上的标题",
      posterTaglineLabel: "宣传语",
      posterTaglinePlaceholder: "一句能打动人的宣传语（可选）",
      posterHint: "你的梦会像电影一样开场：第一张图片就是它的海报，" +
                  "带着这个标题。如果只想要场景画面，清空标题即可。",
      generate: "开始生成",
      progress: (done, total) => `已完成 ${done} / ${total}`,
      summaryImages: (n) => `${n} 张图片，构成一段连贯的画面。`,
      summaryFilm: "一张静态画面，即将动起来。",
      summaryFilmLength: (s) => `${s} 秒的影片。渲染需要几分钟——你可以先离开，之后再回来看。`,
      summaryRefs: (n) =>
        n === 0 ? "没有参考照片——一切都由 AI 创作。"
                : `将使用 ${n} 张参考照片。`,
    },

    step6: {
      title: "你的梦",
      save: "保存到日记",
      added: "已添加到你的梦",
      saveWhileRendering: "先保存——完成后我会来取",
      rendering: "你的影片正在制作中…",
      renderingHint: "这需要几分钟。你可以先离开——完成后" +
                     "它会在你的日记里等你。",
      renderFailed: "影片没有生成成功。你的点数已因这次尝试被扣除——" +
                    "告诉我们，我们会去查一下。",
      nothing: "没有收到任何结果。请从上一步重试。",
    },
  },

  sleep: {
    title: "睡眠",
    subtitle: "围绕睡眠的一切——完全免费。",
    free: "做梦要花点数。睡眠永远不用。",
    tiles: {
      checklist: {
        emoji: "🌜",
        title: "放松入睡",
        text: "今晚的快速入睡清单",
      },
      sounds: {
        emoji: "🌊",
        title: "助眠音效",
        text: "混合不同的噪音色调，让它循环播放",
      },
      guide: {
        emoji: "🧠",
        title: "清醒梦",
        text: "现实检验、MILD、WBTB、记梦日记",
      },
      symbols: {
        emoji: "✧",
        title: "梦境符号",
        text: "你梦中反复出现的东西",
      },
    },
    checklist: {
      lede: "今晚的仪式——打勾状态每天会自动重置。",
      progressLabel: "今晚已完成的步骤",
      remaining: (n) => (n === 0 ? "全部完成——晚安。" : `还剩 ${n} 项`),
      hint: "大约 20 分钟后还没睡着？起来，在昏暗的灯光下做点安静的事，" +
            "困了再回来——躺着醒着会让床学会「醒着」这件事。",
      items: [
        { id: "light",    title: "把一切调暗",
          text: "睡前最后一小时保持昏暗光线——或者完全黑暗：遮光的房间或眼罩。" },
        { id: "shower",   title: "温水淋浴或泡澡",
          text: "在睡前大约 90 分钟进行。之后的降温过程就是身体自身的睡眠信号。" },
        { id: "cool",     title: "让卧室凉一些",
          text: "大约 16–19°C。盖着温暖被子的凉爽房间，胜过温暖的房间。" },
        { id: "caffeine", title: "下午中段之后不再摄入咖啡因",
          text: "它会阻断睡眠压力长达六小时甚至更久——晚上喝咖啡就是早上的疲惫。" },
        { id: "screens",  title: "远离屏幕",
          text: "最后半小时留给纸质阅读、声音，或者什么都不做。日记留到早上再写。" },
        { id: "relax",    title: "放松每一块肌肉",
          text: "从脚趾到下颌：每组肌肉绷紧五秒，放松，再换下一组。这份清单里被验证最多的方法。" },
        { id: "breathe",  title: "放慢呼吸",
          text: "吸气 4 秒，屏息 7 秒，呼气 8 秒——重复几轮。长呼气能让身体切换到休息状态。" },
      ],
    },
    sounds: {
      lede: "三种噪音色调，可以按你喜欢的比例混合。它们会循环播放，" +
            "直到你停止——即使你在使用应用的其他部分，它们也会继续。",
      names: { white: "白噪音", pink: "粉红噪音", brown: "棕色噪音" },
      descs: { white: "明亮的静电声，能掩盖一切", pink: "像持续的雨声", brown: "像远处的海洋" },
      autoStart: "打开应用时自动播放我的混音",
      autoStartHint: "浏览器需要先有一次点击——你的混音会在第一次点触后开始播放。",
      background: "无论你在应用里去到哪个页面，混音都会继续播放。右上角的" +
                  "扬声器按钮可以随时静音。",
    },
    soundsMute: "静音助眠音效",
    soundsUnmute: "取消静音助眠音效",
  },

  onboarding: {
    tagline: "你的梦，被冲洗成影像。",
    swipe: "滑动",
    slides: [
      { title: "记录每一个梦",
        text: "半梦半醒时说出来——助手会问对的问题，" +
              "替你把这一夜写下来。" },
      { title: "让你的梦可视化",
        text: "它会变成一组电影感的图片——里面的人物、宠物和地点" +
              "都是真实的样子。选出你最喜欢的一张，" +
              "把它变成一部短片。" },
      { title: "还有更多，全部免费",
        text: "清醒梦指南，以及你反复出现的符号" +
              "可能意味着什么——随时可以查看。" },
    ],
    start: "开始使用",
    gateTitle: "让它属于你",
    gateText: "和助手进行一次两分钟的对话，就能让你的资料" +
              "更加个性化——你是怎么做梦的、什么反复出现、" +
              "该怎么称呼你。任何问题都可以跳过。",
    gateReward: "✦ 完成后获得 3 点免费点数",
    gateStart: "开始对话",
    gateLater: "以后再说",
    surveyTitle: "先来了解你",
    selfieTitle: "最后一件事",
    selfieText: "添加一张你的照片，梦境图片里就能出现真正的你——" +
                "图片会使用你真实的面孔。这一步随时可以以后再做。",
    selfieAdd: "添加我的照片",
    selfieSkip: "暂时不用",
    granted: "✦ 欢迎——已添加 3 点数",
    thanks: "✦ 谢谢——你的资料已完成",
    profileCard: "花 2 分钟对话完善你的资料",
    profileCardHint: "✦ 完成后可获得 3 点免费点数",
    startMenuTitle: "开始之前",
    startMenuText: "查看新手引导，还是直接进入应用？",
    startMenuOnboarding: "查看新手引导",
    startMenuSkip: "直接进入应用",
  },

  voice: {
    title: "讲述一个梦",
    cancel: "关闭",
    connecting: "正在唤醒…",
    yourTurn: "尽管说——我在听",
    listening: "…",
    type: "打字",
    finish: "完成",
    send: "发送",
    typePlaceholder: "或者改为打字…",
    errors: {
      NO_GEMINI_KEY: "⚠ 服务器上没有语音密钥。请设置 GEMINI_KEY 并重启。",
      MIC_DENIED: "⚠ 麦克风权限被拒绝。请在浏览器设置中允许访问。",
      UPSTREAM: "⚠ 语音服务连接中断。请重试。",
      SOCKET: "⚠ 无法连接到语音服务。",
      CLOSED: "⚠ 连接已断开。请重试。",
    },
  },

  paywall: {
    title: "Dream Rushes Plus",
    close: "关闭",
    headline: "把你的梦，拍成电影。",
    lede: "文字记录、语音以及睡眠标签页里的一切都将永久免费。点数只用于渲染引擎需要绘制的部分。",
    tabSub: "订阅",
    tabPack: "购买点数",
    periodName: { month: "月付", year: "年付" },
    packName: (n) => `${n} 点数`,
    per: { month: "每月", year: "每年" },
    oneTime: "一次性",
    save: (pct) => `节省 ${pct}`,
    creditsPerMonth: (n) => `每月 ${n} 点数`,
    creditsOnce: (n) => `${n} 点数，永不过期`,
    yield: (credits, five, three) =>
      `${credits} 点数——大约可生成 ${five} 个 5 张图的梦，或 ${three} 个 3 张图的梦。一部影片的花费和 5 张图相同。`,
    included: "始终包含，完全免费",
    chips: [
      "无限记录日记", "语音录制", "AI 润色重写",
      "助眠音效", "放松清单", "清醒梦指南", "梦境符号",
    ],
    freeNote: "只有生成图片和影片才需要点数——因为这部分需要付费给渲染引擎。",
    cta: "继续",
    notYet: "⚠ 支付功能尚未接入——这只是套餐的预览。",
    balance: (n) => `你目前有 ${n} 点数。`,
  },

  errors: {
    storageFull: "⚠ 存储空间已满——请删除旧的条目或参考照片。",
    unexpected: "服务器返回了意外的响应。",
    serverStatus: (s) => `服务器返回状态 ${s}。`,
  },
};
