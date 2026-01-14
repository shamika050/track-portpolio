import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
    CssBaseline,
    ThemeProvider,
    createTheme,
    Box,
    AppBar,
    Toolbar,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Container,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    AccountBalance as InvestmentsIcon,
    TrendingUp as ReturnsIcon,
    Lightbulb as InsightsIcon,
    Settings as SettingsIcon,
    Menu as MenuIcon,
} from '@mui/icons-material';

// Import pages
import Dashboard from './pages/Dashboard';
import Investments from './pages/Investments';
import Returns from './pages/Returns';
import Insights from './pages/Insights';
import Settings from './pages/Settings';

const drawerWidth = 240;

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#6366f1', // Modern indigo
            light: '#818cf8',
            dark: '#4f46e5',
        },
        secondary: {
            main: '#ec4899', // Modern pink
            light: '#f472b6',
            dark: '#db2777',
        },
        success: {
            main: '#10b981', // Modern green
            light: '#34d399',
            dark: '#059669',
        },
        error: {
            main: '#ef4444', // Modern red
            light: '#f87171',
            dark: '#dc2626',
        },
        warning: {
            main: '#f59e0b', // Modern amber
        },
        info: {
            main: '#3b82f6', // Modern blue
        },
        background: {
            default: '#f9fafb',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 700,
        },
        h6: {
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 12,
    },
    shadows: [
        'none',
        '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        ...Array(19).fill('0 25px 50px -12px rgb(0 0 0 / 0.25)'),
    ],
});

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Investments', icon: <InvestmentsIcon />, path: '/investments' },
    { text: 'Returns', icon: <ReturnsIcon />, path: '/returns' },
    { text: 'AI Insights', icon: <InsightsIcon />, path: '/insights' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

function NavigationDrawer({ open, onClose }) {
    const location = useLocation();

    return (
        <Drawer
            anchor="left"
            open={open}
            onClose={onClose}
            sx={{
                width: drawerWidth,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                },
            }}
        >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                component={Link}
                                to={item.path}
                                selected={location.pathname === item.path}
                                onClick={onClose}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Drawer>
    );
}

function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [baseCurrency, setBaseCurrency] = useState('AUD');

    useEffect(() => {
        // Load base currency from localStorage
        const saved = localStorage.getItem('baseCurrency');
        if (saved) setBaseCurrency(saved);
    }, []);

    const handleCurrencyChange = (newCurrency) => {
        setBaseCurrency(newCurrency);
        localStorage.setItem('baseCurrency', newCurrency);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Box sx={{ display: 'flex' }}>
                    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                        <Toolbar>
                            <IconButton
                                color="inherit"
                                edge="start"
                                onClick={() => setDrawerOpen(true)}
                                sx={{ mr: 2 }}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                                Portfolio Tracker
                            </Typography>
                            <Typography variant="body2" sx={{ mr: 2 }}>
                                Base Currency: {baseCurrency}
                            </Typography>
                        </Toolbar>
                    </AppBar>

                    <NavigationDrawer
                        open={drawerOpen}
                        onClose={() => setDrawerOpen(false)}
                    />

                    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                        <Toolbar />
                        <Container maxWidth="xl">
                            <Routes>
                                <Route
                                    path="/"
                                    element={<Dashboard baseCurrency={baseCurrency} />}
                                />
                                <Route
                                    path="/investments"
                                    element={<Investments baseCurrency={baseCurrency} />}
                                />
                                <Route
                                    path="/returns"
                                    element={<Returns baseCurrency={baseCurrency} />}
                                />
                                <Route
                                    path="/insights"
                                    element={<Insights baseCurrency={baseCurrency} />}
                                />
                                <Route
                                    path="/settings"
                                    element={
                                        <Settings
                                            baseCurrency={baseCurrency}
                                            onCurrencyChange={handleCurrencyChange}
                                        />
                                    }
                                />
                            </Routes>
                        </Container>
                    </Box>
                </Box>
            </Router>
        </ThemeProvider>
    );
}

export default App;
