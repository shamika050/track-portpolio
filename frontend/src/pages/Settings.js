import React from 'react';
import {
    Box,
    Typography,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
} from '@mui/material';

const currencies = ['AUD', 'USD', 'SGD', 'LKR', 'EUR', 'GBP'];

export default function Settings({ baseCurrency, onCurrencyChange }) {
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Settings
            </Typography>

            <Paper sx={{ p: 3, maxWidth: 600 }}>
                <Typography variant="h6" gutterBottom>
                    Currency Settings
                </Typography>

                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Base Currency</InputLabel>
                    <Select
                        value={baseCurrency}
                        label="Base Currency"
                        onChange={(e) => onCurrencyChange(e.target.value)}
                    >
                        {currencies.map((currency) => (
                            <MenuItem key={currency} value={currency}>
                                {currency}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Alert severity="info" sx={{ mt: 3 }}>
                    All portfolio values will be converted to {baseCurrency} for net worth calculations.
                    Change this setting to view your portfolio in a different currency.
                </Alert>

                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                    API Configuration
                </Typography>

                <Alert severity="warning" sx={{ mt: 2 }}>
                    API keys are configured in the backend .env file:
                    <br />
                    <br />
                    • ANTHROPIC_API_KEY - For AI insights
                    <br />
                    • ALPHA_VANTAGE_API_KEY - For stock prices
                    <br />
                    <br />
                    Restart the backend server after changing API keys.
                </Alert>
            </Paper>
        </Box>
    );
}
