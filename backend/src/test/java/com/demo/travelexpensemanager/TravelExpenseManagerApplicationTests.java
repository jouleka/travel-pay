package com.demo.travelexpensemanager;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {"jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=", "spring.datasource.password=", "spring.datasource.url=jdbc:h2:mem:travelpay-test;DB_CLOSE_DELAY=-1"})
class TravelExpenseManagerApplicationTests {

    @Test
    void contextLoads() {
    }

}
