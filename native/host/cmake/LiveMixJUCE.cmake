# Pins the JUCE version the plug-in host builds against and adds it to the build.
# Same pin and resolution order as kkfonie's cmake/KKFonieJUCE.cmake, so one
# ~/JUCE checkout serves both repositories.
#
# Resolution order:
#   1. -DJUCE_DIR=<path> or $ENV{JUCE_DIR}
#   2. ~/JUCE
#   3. FetchContent of the pinned tag (no checkout needed; slower first configure)
# A checkout whose version differs from LIVE_MIX_JUCE_VERSION is an error unless
# -DLIVE_MIX_ALLOW_JUCE_MISMATCH=ON is passed.

set(LIVE_MIX_JUCE_VERSION "9.0.2")
set(LIVE_MIX_JUCE_GIT_TAG "9.0.2")
set(LIVE_MIX_JUCE_COMMIT "72782788ce18c2d4d760b28e0921d6ffc6431102")
set(LIVE_MIX_JUCE_REPOSITORY "https://github.com/juce-framework/JUCE.git")

option(LIVE_MIX_ALLOW_JUCE_MISMATCH "Build against a JUCE checkout whose version differs from the pinned one" OFF)

function(live_mix_read_juce_version dir out_var)
    set(${out_var} "" PARENT_SCOPE)
    if(NOT EXISTS "${dir}/CMakeLists.txt")
        return()
    endif()
    file(STRINGS "${dir}/CMakeLists.txt" _line REGEX "project\\(JUCE VERSION [0-9]+\\.[0-9]+\\.[0-9]+")
    string(REGEX MATCH "[0-9]+\\.[0-9]+\\.[0-9]+" _version "${_line}")
    set(${out_var} "${_version}" PARENT_SCOPE)
endfunction()

macro(live_mix_add_juce)
    if(NOT DEFINED JUCE_DIR AND DEFINED ENV{JUCE_DIR} AND NOT "$ENV{JUCE_DIR}" STREQUAL "")
        set(JUCE_DIR "$ENV{JUCE_DIR}" CACHE PATH "Path to JUCE")
    endif()
    if(NOT DEFINED JUCE_DIR AND EXISTS "$ENV{HOME}/JUCE/CMakeLists.txt")
        set(JUCE_DIR "$ENV{HOME}/JUCE" CACHE PATH "Path to JUCE")
    endif()

    if(DEFINED JUCE_DIR AND EXISTS "${JUCE_DIR}/CMakeLists.txt")
        live_mix_read_juce_version("${JUCE_DIR}" _live_mix_found_juce)
        if(NOT _live_mix_found_juce STREQUAL LIVE_MIX_JUCE_VERSION)
            if(LIVE_MIX_ALLOW_JUCE_MISMATCH)
                message(WARNING "JUCE at ${JUCE_DIR} is ${_live_mix_found_juce}; live-mix pins ${LIVE_MIX_JUCE_VERSION}.")
            else()
                message(FATAL_ERROR
                    "JUCE at ${JUCE_DIR} is version '${_live_mix_found_juce}' but the plug-in host pins ${LIVE_MIX_JUCE_VERSION}.\n"
                    "Check out the pinned tag (`git -C ${JUCE_DIR} fetch --tags && git -C ${JUCE_DIR} checkout ${LIVE_MIX_JUCE_GIT_TAG}`),\n"
                    "unset JUCE_DIR to fetch the pinned version automatically, or pass -DLIVE_MIX_ALLOW_JUCE_MISMATCH=ON.")
            endif()
        endif()
        message(STATUS "live-mix: using JUCE ${_live_mix_found_juce} from ${JUCE_DIR}")
        add_subdirectory(${JUCE_DIR} JUCE EXCLUDE_FROM_ALL)
    else()
        message(STATUS "live-mix: fetching JUCE ${LIVE_MIX_JUCE_GIT_TAG} (${LIVE_MIX_JUCE_COMMIT})")
        include(FetchContent)
        FetchContent_Declare(juce
            GIT_REPOSITORY ${LIVE_MIX_JUCE_REPOSITORY}
            GIT_TAG        ${LIVE_MIX_JUCE_GIT_TAG}
            GIT_SHALLOW    TRUE
        )
        FetchContent_GetProperties(juce)
        if(NOT juce_POPULATED)
            FetchContent_Populate(juce)
            add_subdirectory(${juce_SOURCE_DIR} ${juce_BINARY_DIR} EXCLUDE_FROM_ALL)
        endif()
    endif()
endmacro()
