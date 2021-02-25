/* Copyright Zhejiang lab, https://www.zhejianglab.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @File: updatetraininglib.js
 * @Time: 2021/02/25 15:09:24
 * @Author: qibo 000846
 * @Email: qibo@zhejianglab.com
 * @License: Apache License v2.0
 */
const path = require('path');
const childprocess = require('child_process');
const {
    stderr,
    stdout
} = require('process');
const getos = require('getos')

function updateSnnFlowLib() {
    var osCurr = '';
    getos((error, os) => {
        if (error) {
            console.error(error);
        }
        osCurr = os;
    });
    childprocess.exec(path.join('git submodule update'), (error, stdout, stderr) => {
        if (error) {
            console.error(`${error}`);
        } else {
            osCurr.os === 'win32' ?
                childprocess.execSync("git checkout win32", {
                    cwd: 'lib/snnflow'
                }) : childprocess.execSync("git checkout linux", {
                    cwd: 'lib/snnflow'
                });
            if (stdout) console.log(`${stdout}`);
            if (stderr) console.error(`${stderr}`);
        }
    });
}
updateSnnFlowLib();