module.exports = {
    ping: () => 'pong',
    dontUnderstand: (cmd) => `"${cmd}" is not a valid command, type "help" for assistance.`,
    unknownType: (type, wakeWord) => `"${type}" is not a valid type. You need to tell me if you want a "movie" or "show"\neg: ${wakeWord} find movie Forrest Gump`,
    rowNotFound: (wakeWord) => `We cannot find this row. Check your ID and try again or use the find command to get new results.\neg: ${wakeWord} find movie Forrest Gump`,

    help: (wakeWord) => [
        `You can use me to add movies and tv shows to Plex.`,
        `Try running this command:\n${wakeWord} find movie Blow\nThis will search for the movie Blow and return the results.`,
        `You can also use the first letter of each command:\n${wakeWord} f m Blow\nThis will do the same thing as the full command above.`,
        `Lastly, you can also search for TV Shows by replacing "movie" in the command with "show".\n${wakeWord} find show Dexter`,
        `Run "${wakeWord} commands" to see a full list of commands`
    ],

    commands: (wakeWord) => [
        `${wakeWord} find [movie/show] {Title}`,
        `${wakeWord} add {ID}`,
        `${wakeWord} help`,
        `sonarr list_profiles`,
        `sonarr set_profile {ProfileID}`,
        `radarr list_profiles`,
        `radarr set_profile {ProfileID}`,
    ].join('\n')
};
