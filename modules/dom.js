// Sidebar Navigation
export const sidebar = document.getElementById('sidebar');
export const mainContent = document.getElementById('main-content');
export const navItems = document.querySelectorAll('.nav-item');
export const mobileMenuBtn = document.getElementById('mobileMenuBtn');
export const sidebarOverlay = document.getElementById('sidebarOverlay');

// Roster & Team Management
export const addPlayerForm = document.getElementById('addPlayerForm');
export const playerNameInput = document.getElementById('playerNameInput');
export const playerNumberInput = document.getElementById('playerNumberInput');
export const playerTorwartInput = document.getElementById('playerTorwartInput');
export const editPlayerIndex = document.getElementById('editPlayerIndex');
export const cancelEditButton = document.getElementById('cancelEditButton');
export const rosterListe = document.getElementById('rosterListe');

export const deleteTeamButton = document.getElementById('deleteTeamButton');
export const teamToggle = document.getElementById('teamToggle');
export const teamHeaderTitle = document.getElementById('teamHeaderTitle');
export const rosterTeamNameHeim = document.getElementById('rosterTeamNameHeim');
export const rosterTeamNameGegner = document.getElementById('rosterTeamNameGegner');
export const teamColorInput = document.getElementById('teamColorInput');
export const teamColorTrigger = document.getElementById('teamColorTrigger');
export const teamColorInputGegner = document.getElementById('teamColorInputGegner');
export const teamColorTriggerGegner = document.getElementById('teamColorTriggerGegner');
export const rosterSwapTeamsBtn = document.getElementById('rosterSwapTeamsBtn');

// Main Content Sections
export const rosterBereich = document.getElementById('rosterBereich');
export const spielBereich = document.getElementById('spielBereich');
export const liveOverviewBereich = document.getElementById('liveOverviewBereich');
export const liveOverviewContent = document.getElementById('liveOverviewContent');
export const seasonBereich = document.getElementById('seasonBereich');
export const seasonStatsBereich = document.getElementById('seasonStatsBereich'); // New
export const seasonContent = document.getElementById('seasonContent');
export const teamDiagrammBereich = document.getElementById('teamDiagrammBereich');
export const teamDiagrammContent = document.getElementById('teamDiagrammContent');
export const shotsBereich = document.getElementById('shotsBereich');
export const shotsContent = document.getElementById('shotsContent');
export const exportBereich = null; // Removed
export const exportContent = null; // Removed
export const settingsBereich = document.getElementById('settingsBereich');
export const historieBereich = document.getElementById('historieBereich');
export const historieDetailBereich = document.getElementById('historieDetailBereich');
export const liveHeatmapBereich = document.getElementById('liveHeatmapBereich');
export const protokollBereich = document.getElementById('protokollBereich');

export const historyButtonInline = null;
export const seasonOverviewButtonInline = null;

// Calendar
export const calendarBereich = document.getElementById('calendarBereich');
export const calendarGrid = document.getElementById('calendarGrid');
export const currentMonthLabel = document.getElementById('currentMonthLabel');
export const prevMonthBtn = document.getElementById('prevMonthBtn');
export const nextMonthBtn = document.getElementById('nextMonthBtn');
export const addEventBtn = document.getElementById('addEventBtn');
export const addEventModal = document.getElementById('addEventModal');
export const addEventModalTitle = document.getElementById('addEventModalTitle'); // New
export const closeEventModal = document.getElementById('closeEventModal');
export const saveEventBtn = document.getElementById('saveEventBtn');
export const cancelEventBtn = document.getElementById('cancelEventBtn');
export const eventTitleInput = document.getElementById('eventTitleInput');
export const eventDateInput = document.getElementById('eventDateInput');
export const eventTimeInput = document.getElementById('eventTimeInput');
export const eventLocationInput = document.getElementById('eventLocationInput');
export const eventRepeatInput = document.getElementById('eventRepeatInput');
export const eventRepeatEndInput = document.getElementById('eventRepeatEndInput');
export const recurrenceOptions = document.getElementById('recurrenceOptions');

// Event Details Modal
export const eventDetailsModal = document.getElementById('eventDetailsModal');
export const detailsTitle = document.getElementById('detailsTitle');
export const detailsDate = document.getElementById('detailsDate');
export const detailsTime = document.getElementById('detailsTime');
export const detailsLocation = document.getElementById('detailsLocation');
export const detailsLocationRow = document.getElementById('detailsLocationRow');
export const closeDetailsModal = document.getElementById('closeDetailsModal');
export const closeDetailsBtn = document.getElementById('closeDetailsBtn');
export const deleteEventBtn = document.getElementById('deleteEventBtn');
export const editEventBtn = document.getElementById('editEventBtn');

// Manage UI
export const manageCalendarBtn = document.getElementById('manageCalendarBtn');
export const manageCalendarModal = document.getElementById('manageCalendarModal');
export const closeManageBtn = document.getElementById('closeManageBtn');
export const manageUrlInput = document.getElementById('manageUrlInput');
export const addSubBtn = document.getElementById('addSubBtn');
export const subsList = document.getElementById('subsList');
export const seriesList = document.getElementById('seriesList');

export const exportTeamButton = document.getElementById('exportTeamButton');
export const importTeamButton = document.getElementById('importTeamButton');
export const importFileInput = document.getElementById('importFileInput');
export const saveTeamButton = document.getElementById('saveTeamButton');
export const loadTeamButton = document.getElementById('loadTeamButton');
export const loadTeamModal = document.getElementById('loadTeamModal');
export const savedTeamsList = document.getElementById('savedTeamsList');
export const loadTeamCancel = document.getElementById('loadTeamCancel');
export const saveTeamNameModal = document.getElementById('saveTeamNameModal');
export const saveTeamNameInput = document.getElementById('saveTeamNameInput');
export const saveTeamNameConfirm = document.getElementById('saveTeamNameConfirm');
export const saveTeamNameCancel = document.getElementById('saveTeamNameCancel');
export const viewTeamModal = document.getElementById('viewTeamModal');
export const viewTeamTitle = document.getElementById('viewTeamTitle');
export const editTeamNameInput = document.getElementById('editTeamNameInput');
export const viewTeamPlayersList = document.getElementById('viewTeamPlayersList');
export const saveTeamChanges = document.getElementById('saveTeamChanges');
export const viewTeamClose = document.getElementById('viewTeamClose');

export const backToRosterButton = document.getElementById('backToRosterButton');
export const gamePhaseButton = document.getElementById('gamePhaseButton');
export const timerAnzeige = document.getElementById('timerAnzeige');
export const sidebarTimer = document.getElementById('sidebarTimer');
export const pauseButton = document.getElementById('pauseButton');
export const zurueckButton = document.getElementById('zurueckButton');
export const vorButton = document.getElementById('vorButton');
export const suspensionContainer = document.getElementById('suspensionContainer');
export const scoreWrapper = document.getElementById('scoreWrapper'); // Legacy Scoreboard wrapper (might be unused now)
export const scoreAnzeige = document.getElementById('scoreAnzeige');
export const scoreAnzeigeGegner = document.getElementById('scoreAnzeigeGegner');
export const teamNameHeimDisplay = document.getElementById('teamNameHeimDisplay');
export const teamNameGegnerDisplay = document.getElementById('teamNameGegnerDisplay');
export const heimScoreUp = document.getElementById('heimScoreUp');
export const heimScoreDown = document.getElementById('heimScoreDown');
export const gegnerScoreUp = document.getElementById('gegnerScoreUp');
export const gegnerScoreDown = document.getElementById('gegnerScoreDown');
export const neuesSpielButton = document.getElementById('neuesSpielButton');
export const exportButton = document.getElementById('exportButton');
export const exportCsvButton = document.getElementById('exportCsvButton');
export const exportPdfButton = document.getElementById('exportPdfButton');

// NEW GAME VIEW ELEMENTS - Dual Team Layout
export const heimGoalkeeperRoster = document.getElementById('heimGoalkeeperRoster');
export const heimActiveRoster = document.getElementById('heimActiveRoster');
export const heimBenchRoster = document.getElementById('heimBenchRoster');
export const gastGoalkeeperRoster = document.getElementById('gastGoalkeeperRoster');
export const gastActiveRoster = document.getElementById('gastActiveRoster');
export const gastBenchRoster = document.getElementById('gastBenchRoster');
export const heimPanelTitle = document.getElementById('heimPanelTitle');
export const gastPanelTitle = document.getElementById('gastPanelTitle');
export const actionDashboard = document.getElementById('actionDashboard');
export const selectedPlayerName = document.getElementById('selectedPlayerName');
export const undoButton = document.getElementById('undoButton');
export const actionParadeBtn = document.getElementById('actionParadeBtn');
export const moreActionsBtn = document.getElementById('moreActionsBtn');

// Removed Old Elements (kept as null for safety during transition if needed, or just removed)
export const heimSpielerRaster = null;
export const gegnerSpielerRaster = null;
export const labelSpielerHeimRaster = null;
export const labelSpielerGegnerRaster = null;
export const spielerAuswahlContainer = null;

export const protokollAusgabe = document.getElementById('protokollAusgabe');

// Modal Elements (kept if used for other things, but game actions moved to dashboard)
export const aktionsMenue = document.getElementById('aktionsMenue');
export const aktionsMenueTitel = document.getElementById('aktionsMenueTitel');
export const aktionAbbrechen = null;
export const guteAktionModalButton = null;
export const aktionVorauswahl = document.getElementById('aktionVorauswahl'); // Still might be used for 'Other' actions? Or moved to popup?
export const aktionVorauswahlAbbrechen = null;
export const kommentarBereich = document.getElementById('kommentarBereich');
export const kommentarTitel = document.getElementById('kommentarTitel');
export const kommentarInput = document.getElementById('kommentarInput');
export const kommentarSpeichernButton = document.getElementById('kommentarSpeichernButton');
export const settingsButton = document.getElementById('settingsButton');
export const settingsSchliessen = document.getElementById('settingsSchliessen');
export const toggleDarkMode = document.getElementById('toggleDarkMode');
export const myTeamNameInput = document.getElementById('myTeamNameInput');

export const toggleWurfbildHeim = document.getElementById('toggleWurfbildHeim');
export const toggleWurfbildGegner = document.getElementById('toggleWurfbildGegner');
export const inputTeamNameHeim = document.getElementById('inputTeamNameHeim');
export const inputTeamNameGegner = document.getElementById('inputTeamNameGegner');
export const toggleAuswaertsspiel = document.getElementById('toggleAuswaertsspiel');

export const statistikSidebar = document.getElementById('statistikSidebar');
export const statistikWrapper = document.getElementById('statistikWrapper');
export const statistikTabelleBody = document.getElementById('statistikTabelleBody');
export const wurfbildModal = document.getElementById('wurfbildModal');
export const wurfbildTitel = document.getElementById('wurfbildTitel');
export const wurfbildUmgebung = document.getElementById('wurfbildUmgebung');
export const inputGoalSvg = document.getElementById('inputGoalSvg');
export const wurfbildUeberspringen = document.getElementById('wurfbildUeberspringen');
export const showWurfbilderButton = document.getElementById('showWurfbilderButton');
export const wurfbilderStatsModal = document.getElementById('wurfbilderStatsModal');
export const wurfbilderContainer = document.getElementById('wurfbilderContainer');
export const closeWurfbilderStats = document.getElementById('closeWurfbilderStats');
export const gegnerNummerModal = document.getElementById('gegnerNummerModal');
export const gegnerNummerTitel = document.getElementById('gegnerNummerTitel');
export const bekannteGegnerListe = document.getElementById('bekannteGegnerListe');
export const neueGegnerNummer = document.getElementById('neueGegnerNummer');
export const gegnerNummerSpeichern = document.getElementById('gegnerNummerSpeichern');
export const gegnerNummerUeberspringen = document.getElementById('gegnerNummerUeberspringen');
export const sevenMeterOutcomeModal = document.getElementById('sevenMeterOutcomeModal');
export const globalAktionen = document.getElementById('globalAktionen');

export const addGegnerModal = document.getElementById('addGegnerModal');
export const addGegnerNummerInput = document.getElementById('addGegnerNummerInput');
export const addGegnerNameInput = document.getElementById('addGegnerNameInput');
export const addGegnerTorwartInput = document.getElementById('addGegnerTorwartInput');
export const addGegnerSpeichern = document.getElementById('addGegnerSpeichern');
export const addGegnerAbbrechen = document.getElementById('addGegnerAbbrechen');

export const quickAddPlayerModal = document.getElementById('quickAddPlayerModal');
export const quickPlayerNumber = document.getElementById('quickPlayerNumber');
export const quickPlayerName = document.getElementById('quickPlayerName');
export const quickPlayerTorwart = document.getElementById('quickPlayerTorwart');
export const quickAddPlayerSave = document.getElementById('quickAddPlayerSave');
export const quickAddPlayerCancel = document.getElementById('quickAddPlayerCancel');

export const neueGegnerName = document.getElementById('neueGegnerName');
export const neueGegnerTorwart = document.getElementById('neueGegnerTorwart');

export const toggleWurfpositionHeim = document.getElementById('toggleWurfpositionHeim');
export const toggleWurfpositionGegner = document.getElementById('toggleWurfpositionGegner');
export const wurfpositionModal = document.getElementById('wurfpositionModal');
export const wurfpositionFeld = document.getElementById('wurfpositionFeld');
export const wurfpositionUeberspringen = document.getElementById('wurfpositionUeberspringen');

// Combined Throw Modal
export const combinedThrowModal = document.getElementById('combinedThrowModal');
export const combinedWurfpositionFeld = document.getElementById('combinedWurfpositionFeld');
export const combinedWurfbildUmgebung = document.getElementById('combinedWurfbildUmgebung');
export const combinedGoalSvg = document.getElementById('combinedGoalSvg');
export const combinedFieldMarker = document.getElementById('combinedFieldMarker');
export const combinedGoalMarker = document.getElementById('combinedGoalMarker');
export const combinedThrowSave = document.getElementById('combinedThrowSave');
export const combinedThrowSkip = document.getElementById('combinedThrowSkip');
export const toggleCombinedThrow = document.getElementById('toggleCombinedThrow');
export const combinedAssistPlayerList = document.getElementById('combinedAssistPlayerList');
export const combinedAssistNone = document.getElementById('combinedAssistNone');
export const combinedPlayTypeList = document.getElementById('combinedPlayTypeList');

export const heatmapSvg = document.getElementById('heatmapSvg');
export const heatmapTeamToggle = document.getElementById('heatmapTeamToggle');
export const heatmapPlayerSelect = document.getElementById('heatmapPlayerSelect');
export const heatmapHeimLabel = document.getElementById('heatmapHeimLabel');
export const heatmapGegnerLabel = document.getElementById('heatmapGegnerLabel');
export const heatmapToreFilter = document.getElementById('heatmapToreFilter');
export const heatmap7mFilter = document.getElementById('heatmap7mFilter');
export const heatmapMissedFilter = document.getElementById('heatmapMissedFilter');

// History UI
export const spielBeendenButton = document.getElementById('spielBeendenButton');
export const historieListe = document.getElementById('historieListe');
export const backToStartFromHistory = document.getElementById('backToStartFromHistory');
export const historyButton = document.getElementById('historyButton');
export const seasonOverviewButton = document.getElementById('seasonOverviewButton');
export const seasonOverviewModal = document.getElementById('seasonOverviewModal');
export const seasonSummary = document.getElementById('seasonSummary');
export const seasonStatsContainer = document.getElementById('seasonStatsContainer');
export const seasonOverviewClose = document.getElementById('seasonOverviewClose');
export const exportHistorieButton = document.getElementById('exportHistorieButton');
export const importSpielButton = document.getElementById('importSpielButton');
export const importSpielInput = document.getElementById('importSpielInput');

// History Detail UI
export const backToHistoryList = document.getElementById('backToHistoryList');
export const histDetailTeams = document.getElementById('histDetailTeams');
export const histDetailScore = document.getElementById('histDetailScore');
export const histDetailDate = document.getElementById('histDetailDate');

export const histTabHeatmap = document.getElementById('histTabHeatmap');
export const histTabProtokoll = document.getElementById('histTabProtokoll');
export const histTabTorfolge = document.getElementById('histTabTorfolge');
export const histContentHeatmap = document.getElementById('histContentHeatmap');
export const histContentProtokoll = document.getElementById('histContentProtokoll');
export const histContentTorfolge = document.getElementById('histContentTorfolge');
export const histProtokollAusgabe = document.getElementById('histProtokollAusgabe');
export const histTorfolgeChart = document.getElementById('histTorfolgeChart');

export const histStatsBody = document.getElementById('histStatsBody');
export const histStatsGegnerBody = document.getElementById('histStatsGegnerBody');

export const histSubTabTor = document.getElementById('histSubTabTor');
export const histSubTabFeld = document.getElementById('histSubTabFeld');
export const histSubTabKombi = document.getElementById('histSubTabKombi');
export const histHeatmapSvg = document.getElementById('histHeatmapSvg');
export const histHeatmapToreFilter = document.getElementById('histHeatmapToreFilter');
export const histHeatmap7mFilter = document.getElementById('histHeatmap7mFilter');
export const histHeatmapMissedFilter = document.getElementById('histHeatmapMissedFilter');
export const histHeatmapStatsArea = document.getElementById('histHeatmapStatsArea');
export const histHeatmapStatsBodyHome = document.getElementById('histHeatmapStatsBodyHome');
export const histHeatmapStatsBodyGegner = document.getElementById('histHeatmapStatsBodyGegner');
export const histHeatmapHomeTitle = document.getElementById('histHeatmapHomeTitle');
export const histHeatmapGegnerTitle = document.getElementById('histHeatmapGegnerTitle');
export const histHeatmapPlayerSelect = document.getElementById('histHeatmapPlayerSelect');
export const histHeatmapTeamToggle = document.getElementById('histHeatmapTeamToggle');
export const histHeatTeamLabelHeim = document.getElementById('histHeatTeamLabelHeim');
export const histHeatTeamLabelGegner = document.getElementById('histHeatTeamLabelGegner');

// Custom Confirm/Alert Modal
export const customConfirmModal = document.getElementById('customConfirmModal');
export const customConfirmTitle = document.getElementById('customConfirmTitle');
export const customConfirmMessage = document.getElementById('customConfirmMessage');
export const customConfirmYes = document.getElementById('customConfirmYes');
export const customConfirmNo = document.getElementById('customConfirmNo');
export const customAlertModal = document.getElementById('customAlertModal');
export const customAlertTitle = document.getElementById('customAlertTitle');
export const customAlertMessage = document.getElementById('customAlertMessage');
export const customAlertOk = document.getElementById('customAlertOk');

// Custom Prompt Modal
export const customPromptModal = document.getElementById('customPromptModal');
export const customPromptTitle = document.getElementById('customPromptTitle');
export const customPromptMessage = document.getElementById('customPromptMessage');
export const customPromptInput = document.getElementById('customPromptInput');
export const customPromptConfirm = document.getElementById('customPromptConfirm');
export const customPromptCancel = document.getElementById('customPromptCancel');

// Load Play Modal
export const loadPlayModal = document.getElementById('loadPlayModal');
export const loadPlayList = document.getElementById('loadPlayList');
export const closeLoadPlayModal = document.getElementById('closeLoadPlayModal');

// Live Game Overview
export const showLiveGameOverviewButton = document.getElementById('showLiveGameOverviewButton');
export const liveGameOverviewModal = document.getElementById('liveGameOverviewModal');
export const liveOverviewTabStats = document.getElementById('liveOverviewTabStats');
export const liveOverviewTabHeatmap = document.getElementById('liveOverviewTabHeatmap');
export const liveOverviewContentStats = document.getElementById('liveOverviewContentStats');
export const liveOverviewContentHeatmap = document.getElementById('liveOverviewContentHeatmap');
export const liveOverviewStatsBody = document.getElementById('liveOverviewStatsBody');
export const liveOverviewStatsGegnerBody = document.getElementById('liveOverviewStatsGegnerBody');
export const liveOverviewSubTabTor = document.getElementById('liveOverviewSubTabTor');
export const liveOverviewSubTabFeld = document.getElementById('liveOverviewSubTabFeld');
export const liveOverviewSubTabKombi = document.getElementById('liveOverviewSubTabKombi');
export const liveOverviewHeatmapSvg = document.getElementById('liveOverviewHeatmapSvg');
export const liveOverviewHeatmapToreFilter = document.getElementById('liveOverviewHeatmapToreFilter');
export const liveOverviewHeatmap7mFilter = document.getElementById('liveOverviewHeatmap7mFilter');
export const liveOverviewHeatmapMissedFilter = document.getElementById('liveOverviewHeatmapMissedFilter');
export const closeLiveGameOverview = document.getElementById('closeLiveGameOverview');
