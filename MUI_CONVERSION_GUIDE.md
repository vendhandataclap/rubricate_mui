# Material-UI Conversion Guide

This guide shows you how to convert remaining components to Material-UI following the patterns established in the core conversions.

## Core Pattern Conversions Completed

✅ `ThemeProvider.tsx` - Now uses MUI's theme system
✅ `AdminLayout.tsx` - Uses Drawer, List, ListItemButton
✅ `RecruiterLayout.tsx` - Uses Drawer, List, ListItemButton  
✅ `SignIn.tsx` - Uses TextField, Tabs, Alert, Card
✅ `Admin Dashboard.tsx` - Uses Grid, Card, Chip

## Remaining Components to Convert

### 1. ThemeToggle Component
**Location**: `src/components/shared/ThemeToggle.tsx`

**Pattern**:
```typescript
import { IconButton, useTheme } from '@mui/material'
import { Moon, Sun } from 'lucide-react'
import { useTheme as useAppTheme } from './ThemeProvider'

export default function ThemeToggle({ iconOnly }: { iconOnly?: boolean }) {
  const muiTheme = useTheme()
  const { theme, setTheme } = useAppTheme()

  const handleToggle = () => {
    if (theme === 'system') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('light')
    } else {
      setTheme('system')
    }
  }

  return (
    <IconButton size="small" onClick={handleToggle} color="inherit">
      {muiTheme.palette.mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </IconButton>
  )
}
```

### 2. Table Components
**Pattern for replacing table elements**:
```typescript
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Chip
} from '@mui/material'

// Replace simple HTML table with MUI Table
// Use TableContainer for responsive wrapping
// Use Chip for status badges
// Use IconButton for action buttons
```

### 3. Form Components
**Pattern for forms**:
```typescript
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  Button,
  Stack,
} from '@mui/material'

// Replace input[type="text"] with TextField
// Replace select with Select component
// Replace button with Button component
// Use Stack for layout instead of divs
```

### 4. Modal/Dialog Components
**Pattern**:
```typescript
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'

// Replace custom modals with MUI Dialog
// Use DialogTitle, DialogContent, DialogActions
```

### 5. List/Card Components
**Pattern**:
```typescript
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
} from '@mui/material'

// Replace custom lists with MUI List components
// Use Card instead of custom .card divs
// Use ListItem for list rows
```

## Commonly Used MUI Imports

```typescript
// Layout
import { Box, Container, Grid, Stack, Paper } from '@mui/material'

// Navigation
import { AppBar, Drawer, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'

// Forms
import { TextField, Button, Select, MenuItem, FormControl, Checkbox, Radio } from '@mui/material'

// Display
import { Card, CardContent, CardActions, CardHeader, Typography, Chip, Badge, Avatar } from '@mui/material'

// Feedback
import { Alert, CircularProgress, Skeleton, Snackbar } from '@mui/material'

// Dialogs
import { Dialog, DialogTitle, DialogContent, DialogActions, Modal } from '@mui/material'

// Utilities
import { useTheme, useMediaQuery } from '@mui/material'
```

## Key Styling Patterns

### Using useTheme Hook
```typescript
const theme = useTheme()

// Access colors
theme.palette.primary.main
theme.palette.background.default
theme.palette.text.primary

// Access breakpoints
const isMobile = useMediaQuery(theme.breakpoints.down('md'))

// Use in sx prop
sx={{
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
}}
```

### sx Prop vs styled()
```typescript
// Prefer sx prop for one-off styles
<Box sx={{ mb: 2, p: 3 }}>

// Use for complex/reusable components
import { styled } from '@mui/material/styles'
const StyledBox = styled(Box)(({ theme }) => ({
  // styles here
}))
```

## Quick Replacement Reference

| Old Pattern | New Pattern |
|------------|------------|
| `<div className="btn btn-primary">` | `<Button variant="contained" color="primary">` |
| `<div className="card">` | `<Card>` |
| `<div className="sidebar">` | `<Drawer variant="permanent">` |
| `<input type="text">` | `<TextField variant="outlined">` |
| `<span className="badge">` | `<Chip label="text">` |
| `style={{ color: 'var(--color-text)' }}` | `sx={{ color: theme.palette.text.primary }}` |

## Next Steps

1. Start with pages in `/src/pages/` - convert each page's layout
2. Convert form components in `/src/pages/admin/` and `/src/pages/recruiter/`
3. Update any remaining custom components in `/src/components/`
4. Once all conversions are done, remove the old `src/index.css` file
5. Test all pages and interactions in both light and dark modes

## Testing Checklist

- [ ] Sign in page works with all role tabs
- [ ] Dashboard displays properly
- [ ] Theme toggle works (light/dark/system)
- [ ] Navigation sidebar shows correct active links
- [ ] Forms submit correctly
- [ ] Responsive design works on mobile
- [ ] All pages render without console errors
