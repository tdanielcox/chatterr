module.exports = {

    help: () => [
        `You can use me to add movies and tv shows to Daniel\'s Plex.`,
        `Try running this command:\nroach find movie Blow\nThis will search for the movie Blow and return the results.`,
        `You can also use the first letter of each command:\nr f m Blow\nThis will do the same thing as the full command above.`,
        `Lastly, you can also search for TV Shows by replacing "movie" in the command with "show".\nroach find show Dexter`,
        `Run "roach commands" to see a full list of commands`
    ],

    hi: () => 'Yo',
    test: () => 'Yeah, I\'m here...',

    dontUnderstand: (cmd) => `"${cmd}" is not a valid command, type "help" for assistance.`,

    unknownType: (type) => `"${type}" is not a valid type. You need to tell me if you want a "movie" or "show"\neg: roach find movie Forrest Gump`,

    rowNotFound: () => `We cannot find this row. Check your ID and try again or use the find command to get new results.\neg: roach find movie Forrest Gump`,

    commands: (wakeWord) => [
        `${wakeWord} find [movie/show] {Title}`,
        `${wakeWord} add {ID}`,
        `${wakeWord} help\n`,
        `sonarr list_profiles`,
        `sonarr set_profile {ProfileID}\n`,
        `radarr list_profiles`,
        `radarr set_profile {ProfileID}`,
    ].join('\n')




};
