import { API_BASE_URL } from "../utils/constants";

class ApiService {
    constructor() {
        this.base_URL = API_BASE_URL;
    }
}

export default new ApiService();