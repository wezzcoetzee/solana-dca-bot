export function uptimeLogger(callback: () => void) {
  function getTimeUntilNextHour() {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    return nextHour.getTime() - now.getTime();
  }

  setTimeout(() => {
    console.log("Script is running...", new Date());

    setInterval(() => {
      console.log("Script is running...", new Date());
      callback();
    }, 3600000);
  }, getTimeUntilNextHour());
}
