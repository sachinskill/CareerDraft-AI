const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function run() {
    const form = new FormData();
    form.append('resumeFile', fs.createReadStream('resume.txt'), { filename: 'resume.txt' });
    form.append('jobDescription', 'React Developer');

    try {
        const res = await axios.post('http://localhost:8081/api/v1/resume/ats/upload', form, {
            headers: form.getHeaders()
        });
        fs.writeFileSync('clean_upload.txt', JSON.stringify(res.data, null, 2), 'utf-8');
        console.log("Wrote JSON to clean_upload.txt");
    } catch (e) {
        fs.writeFileSync('clean_upload.txt', "ERROR\n" + JSON.stringify(e.response?.data || e.message, null, 2), 'utf-8');
        console.log("Wrote ERROR to clean_upload.txt");
    }
}
run();
