const bcrypt = require('bcryptjs');
const hash = '$2b$10$MInQ15ItItf6zBXXtPI3vO5/EwbWPV2OCxKU5PMFuR08SJbMOwD9a';
const password = 'password123';

bcrypt.compare(password, hash, (err, res) => {
    if (res) {
        console.log('Match!');
    } else {
        console.log('No match!');
    }
});
