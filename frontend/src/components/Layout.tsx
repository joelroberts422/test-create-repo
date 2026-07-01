import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import {
    AppBar, Drawer, List, ListItemButton, ListItemText, Box, IconButton
} from "@mui/material";


function Layout() {
    const [open, setOpen] = useState(false);

    return (
        <Box>
            <AppBar className="topbar">
                <IconButton color="inherit" edge="start" onClick={() => setOpen(true)}>open</IconButton>
            </AppBar>

            <Drawer open={open} onClose={() => setOpen(false)} >
                <Box sx={{ width: 240 }} role="presentation" onClick={() => setOpen(false)}>
                    <List>
                        <ListItemButton component={Link} to="/">
                            <ListItemText primary="Home" />
                        </ListItemButton>
                        <ListItemButton component={Link} to="/test">
                            <ListItemText primary="Test" />
                        </ListItemButton>
                        <ListItemButton component={Link} to="/library">
                            <ListItemText primary="Library" />
                        </ListItemButton>
                        <ListItemButton component={Link} to="/share">
                            <ListItemText primary="Share" />
                        </ListItemButton>
                    </List>
                </Box>
            </Drawer>

            <Box sx={{ p: 3}}>
                <Outlet />
            </Box>
        </Box>
    );
}

export default Layout;