const d=require('../../lib/dating');

const DATE_HELP = (prefix) => [
    '💞 *DATING COMMANDS & TIPS*',
    '',
    '*Commands*',
    '• '+prefix+'date — register or find available matches',
    '• '+prefix+'setdate location|status|bio|public|available value — update your profile',
    '• '+prefix+'mydate — view your profile',
    '• '+prefix+'resumedate / '+prefix+'startdate — join matchmaking',
    '• '+prefix+'stopdate / '+prefix+'pausedate — pause matchmaking',
    '• '+prefix+'accept — accept a pending proposal',
    '• '+prefix+'reject / '+prefix+'decline — reject a proposal',
    '• '+prefix+'blockdate @user — block a profile from your matches',
        '',
    '*Tips*',
    '• Complete your bio, location and status before searching.',
    '• Set '+prefix+'setdate public yes and '+prefix+'setdate available yes to appear in matches.',
    '• After a match list appears, reply with its number to send a proposal.',
    '• Dating commands work in private chat; share contact details only when comfortable.',
    '• Keep every interaction respectful, consensual and within the law.',
].join('\n');

module.exports={name:'match',aliases:['findmatch'],category:'dating',desc:'Register and find a date',usage:'†date [number|help]',privateOnly:true,async execute(s,m,a,c){
    if((a[0]||'').toLowerCase()==='help') return c.reply(DATE_HELP(c.prefix));
    const x=require('../../lib/db').get('dating','data',{}).pending?.[c.sender];
    return x?.step==='match-select'&&a.length?d.select(s,m,c,x):d.matches(s,m,c);
}};
