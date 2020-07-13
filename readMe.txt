Use cases:
- School specific discord servers - verify if member is actually a member
- Workplaces

Test Cases:
- if @gmail.com, not very secure
- Need to store previously used email to prevent multiple uses of the same email

if verified add to certain role (and from there you can decide, admin can decide what access they have)

Key feature:
- Server Admins don't know the email of users, providing anonymity to users.

https://discord.com/oauth2/authorize?client_id=731623933593518160&permissions=268445696&scope=bot
https://discord.com/oauth2/authorize?client_id=731623933593518160&permissions=8&scope=bot

- Manage Messages
- Manage Roles
- Send Messages
= 268445696


Vulnerable Commands:
!gkemail
!gkverify
!gkwhitelist

Test Cases:
- Reusing a verified email.