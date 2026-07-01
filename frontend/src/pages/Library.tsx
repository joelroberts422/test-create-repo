import { Container, Typography, Paper, Stack } from "@mui/material";
import { Autocomplete, TextField } from "@mui/material";        // Section 1
import { BarChart } from "@mui/x-charts/BarChart";              // Section 3


function ChartSection() {
    const titles = ["Morning Fog", "Harbor Lights", "Red Barn", "Lake Ice"];
    const likes = [42, 88, 30, 65];
  
    return (
        <Paper sx={{ p: 3 }}>
            <BarChart 
                xAxis={[{ scaleType: "band", data: titles }]}
                series={[{ data: likes, label: "Likes" }]}
                height={300}
            />
        </Paper>
    );
}

function SearchSection() {
    const photos = [
      { label: "Morning Fog", id: 1 },
      { label: "Harbor Lights", id: 2 },
      { label: "Red Barn", id: 3 },
      { label: "Lake Ice", id: 4 },
    ];
  
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Search photos</Typography>
        <Autocomplete
          options={photos}
          sx={{ width: 320 }}
          renderInput={(params) => <TextField {...params} label="Find a photo" />}
          onChange={(_event, value) => console.log("picked:", value)}  // value is the chosen option
        />
      </Paper>
    );
  }
  

export default function Library() {
  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={4}>
        <ChartSection />
        <SearchSection />
      </Stack>
    </Container>
  );
}